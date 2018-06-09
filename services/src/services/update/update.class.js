const FeathersSequelize = require('feathers-sequelize');
const logger            = require('winston');

/*
 * This class exist mostly as a wrapper around the feathers-sequelize service
 * for the Update model.
 */
class Update extends FeathersSequelize.Service {
  constructor(options) {
    super(options);

    this.app = options.app;

    /*
     * Undefining some APIs which we don't want/need.
     */
    this.update = undefined;
    this.patch = undefined;
    this.remove = undefined;
  }

  async get(id) {
    const versions = this.app.service('versions');
    const latestVersion = await versions.find({
      query: {
        uuid: id,
        $limit: 1
      },
    });

    let findParams = {};
    this.scopeFindQuery(findParams);

    return {
      schema: 1,
      meta: {
        channel: 'general',
      },
      core: {
      },
      plugins: {
      },
    };
  }

  /*
   * Scope the find query to the appopriate update level for the client
   * requesting an update
   */
  scopeFindQuery(params) {
    let level = 0;
    let channel = 'general';

    /*
     * Use the level provided in the query parameters if it's available,
     * otherwise default to zero
     */
    if (params.query) {
      level = params.query.level || level;
      channel = params.query.channel || channel;
    }

    let query = {
      tainted: false,
      channel: channel,
      $limit: 1,
    };

    /*
     * By default, we want to take the latest Update Level, which is a:
     *  ORDER BY createdAt DESC LIMIT 1
     *
     * For queries with levels, we want to take the _next_ Update Level, which
     * is:
     *  WHERE id  > ? ORDER BY createdAt ASC LIMIT 1
     */
    if (level != 0) {
      Object.assign(query, {
        id: {
          $gt: level,
        },
        $sort: {
          createdAt: 1,
        }
      });
    }
    else {
      Object.assign(query, {
        $sort: {
          createdAt: -1,
        }
      });
    }

    params.query = query;
    return params;
  }
}

module.exports = (options) => { return new Update(options); };
