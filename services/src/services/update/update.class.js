const FeathersSequelize = require('feathers-sequelize');

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

  async get(id, params) {
    const versions = this.app.service('versions');
    const latestVersion = await versions.find({
      query: {
        uuid: id,
        $limit: 1
      },
    });
    const instance = await this.app.service('status').get(id);

    let findParams = {
      query: params.query, /* copy the original query parameters over */
    };
    this.scopeFindQuery(findParams);

    return this.find(findParams).then((records) => {
      let record = records[0];
      let computed = {
        meta: {
          channel: record.channel,
          level: record.id,
        },
        core: record.manifest.core,
        plugins: {
          updates: [
          ],
          deletes: [
          ],
        },
      };
      this.prepareManifestFromRecord(record, computed);
      /*
       * Last but not least, make sure that any flavor specific updates are
       * assigned to the computed update manifest
       */
      this.prepareManifestWithFlavor(instance, record, computed);
      return computed;
    });
  }

  /*
   * Copy the appropriate members from an ingested update level record to the
   * computed update manifest which should be sent to the client
   */
  prepareManifestFromRecord(record, computedManifest) {
    /*
     * When dealing with records which have empty manifests, we can just bail
     * out early.
     */
    if (!record.manifest) {
      return computedManifest;
    }

    record.manifest.plugins.forEach((plugin) => {
      computedManifest.plugins.updates.push({
        url: plugin.url,
        checksum: plugin.checksum,
      });
    });
    return computedManifest;
  }

  /*
   * Prepares the manifest with the updates specific to the given instance's
   * flavor
   */
  prepareManifestWithFlavor(instance, record, computedManifest) {
    if ((!instance.flavor) || (!record.manifest)) {
      return computedManifest;
    }

    let flavor = record.manifest.environments[instance.flavor];
    if (flavor) {
      flavor.plugins.forEach((plugin) => {
        computedManifest.plugins.updates.push({
          url: plugin.url,
          checksum: plugin.checksum,
        });
      });
    }
    return computedManifest;
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
