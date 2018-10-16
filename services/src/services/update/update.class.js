const FeathersSequelize = require('feathers-sequelize');
const errors            = require('@feathersjs/errors');
const logger            = require('winston');

class NotModified extends errors.FeathersError {
  constructor(message, data) {
    super(message, 'not-modified', 304, 'NotModified', data);
  }
}

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
    this.remove = undefined;
  }

  isCurrentLevelPerInstanceTainted(id, level) {
    const Sequelize = this.app.get('sequelizeClient');

    return Sequelize.query(
      `SELECT tainteds."updateId"
FROM tainteds
WHERE tainteds.uuid = ${Sequelize.escape(id)} AND
      tainteds."updateId" = ${Sequelize.escape(level)}`,
      { type: Sequelize.QueryTypes.SELECT})

      .then(results => {
        const tainted = results.length > 0;
        logger.silly(`Is (${id}, ${level}) tainted? => ${tainted} (results=${JSON.stringify(results)})`);
        return tainted;
      });
  }

  /*
   * Return the update level to serve to the requesting instance for the given parameters.
   *
   * The logic for finding the right update level (called UL below) is the following:
   *
   * 1) if the provided/current UL is untainted, then we look for the next UL available.
   * This means one that is the lowest > currentUL.
   *
   * 2) if the provided/current UL is tainted, *then we are triggering a rollback*.
   * This means we look for the highest UL that is < currentUL.
   *
   * 3) if *no* UL is provided, we jump directly to the latest UL available.
   */
  async get(id, params) {

    const channel = params.query.channel || 'general';
    const instance = await this.app.service('status').get(id);
    let level = params.query.level;

    const Sequelize = this.app.get('sequelizeClient');
    const Op = Sequelize.Op;
    let gtOrLt = Op.gt;
    let orderByClause = 1; // ascending by default to take the next one available, not latest
    if (!level) {
      level = 0;
      orderByClause = -1; // take latest level
      gtOrLt = Op.gt;
    } else if (await this.isCurrentLevelPerInstanceTainted(id, level)) {
      orderByClause = -1;
      gtOrLt = Op.lt;
    }

    const query = {
      query: {
        $limit: 1,
        $sort: {
          id: orderByClause,
        },
        channel: channel,
        tainted: false,
        id: {
          [gtOrLt]: level,
          $notIn: Sequelize.literal(`
(SELECT "tainteds"."updateId"
  FROM "tainteds"
  WHERE "tainteds"."uuid" = ${Sequelize.escape(id)}
)`),
        },
      },
    };

    const records = await this.find(query);

    /*
     * If after all that we still have nothing, or we just got the same
     * update level back again, then there's no update for the client
     */
    if ((records.length === 0) || (records[0].id === level)) {
      throw new NotModified('No updates presently available');
    }

    const record = records[0];
    const computed = {
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
    await this.prepareManifestWithFlavor(instance, record, computed);
    await this.filterVersionsForClient(instance, computed);
    return computed;
  }

  /*
   * Use the latest versions from the client to filter out updates which are
   * not necessary
   *
   * @param {Instance} Hydrated Instance model for the given client
   * @param {Map} The work-in-progress update manifest to compute for the
   *  client
   * @return {Boolean} True if we filtered everything properly
   */
  async filterVersionsForClient(instance, computedManifest) {
    const clientVersions = await this.app.service('versions').find({
      query: {
        uuid: instance.uuid,
        $sort: {
          id: -1,
        },
        $limit: 1,
      },
    });
    /*
     * If we have a version (not guaranteed on a fresh installation)
     * then we need to merge the changes to make sure we're only sending the
     * client the updates they need
     */
    if (clientVersions.length === 0) {
      logger.info('No client versions discovered for instance', instance.uuid);
      return false;
    }
    const latestClientVersion = clientVersions[0];

    if (latestClientVersion.manifest.jenkins.core == computedManifest.core.checksum.signature) {
      computedManifest.core = {};
    }

    const pluginsInVersion = Object.keys(latestClientVersion.manifest.jenkins.plugins);
    /*
     * Bail out early if there's no pre-existing plugins
     */
    if (pluginsInVersion.length === 0) {
      return true;
    }

    const signatures = Object.values(latestClientVersion.manifest.jenkins.plugins);

    /*
     * Collect the base level of plugins in this update level
     */
    const artifactIds = computedManifest.plugins.updates.map(p => p.artifactId);

    const updates = [];
    const deletes = [];

    computedManifest.plugins.updates.forEach((plugin) => {
      if (!signatures.includes(plugin.checksum.signature)) {
        updates.push(plugin);
      }
    });

    /*
     * Look through all the plugins in the version reported by the client, and
     * mark anything which no longer exist in the current update level as
     * deleted
     */
    pluginsInVersion.forEach((artifactId) => {
      if (!artifactIds.includes(artifactId)) {
        deletes.push(artifactId);
      }
    });
    computedManifest.plugins.updates = updates;
    computedManifest.plugins.deletes = deletes;
    return true;
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
    if ((!record.manifest) || (!record.manifest.plugins)) {
      return computedManifest;
    }

    record.manifest.plugins.forEach((plugin) => {
      computedManifest.plugins.updates.push({
        url: plugin.url,
        artifactId: plugin.artifactId,
        checksum: plugin.checksum,
      });
    });
    return computedManifest;
  }

  /*
   * Prepares the manifest with the updates specific to the given instance's
   * flavor
   */
  async prepareManifestWithFlavor(instance, record, computedManifest) {
    if (!instance) {
      return computedManifest;
    }

    if ((!instance.flavor) || (!record.manifest) || (!record.manifest.environments)) {
      return computedManifest;
    }

    const flavor = record.manifest.environments[instance.flavor];
    if ((flavor) && (flavor.plugins)) {
      flavor.plugins.forEach((plugin) => {
        /*
         * In the case where a flavor has a newer version of the plugin, we
         * must replace that instead of adding
         */
        let existingIndex = computedManifest.plugins.updates.findIndex((el) => el.artifactId == plugin.artifactId);
        let record = {
          url: plugin.url,
          artifactId: plugin.artifactId,
          checksum: plugin.checksum,
        };

        if (existingIndex != -1) {
          computedManifest.plugins.updates[existingIndex] = record;
        } else {
          computedManifest.plugins.updates.push(record);
        }
      });
    }
    return computedManifest;
  }
}

module.exports = (options) => {
  return new Update(options);
};
module.exports.NotModified = NotModified;
