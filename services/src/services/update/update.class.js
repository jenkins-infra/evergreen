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

  /*
   * Return the latest update level for the given parameters
   *
   * Typically will not be called with an `id`, and is directly
   */
  async get(id, params) {
    const channel = params.query.channel || 'general';
    const level = params.query.level;
    const instance = await this.app.service('status').get(id);

    /*
     * When there isn't any client level, the response is simple, just give
     * them the latest in their channel
     */
    if (!level) {
      return this.find({
        query: {
          $limit: 1,
          $sort: {
            id: -1,
          },
          channel: channel,
          tainted: false,
        },
      }).then(async (records) => {
        if (records.length === 0) {
          logger.debug('No updates discovered for', instance.uuid);
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
      });
    }
    const Sequelize = this.app.get('sequelizeClient');

    /*
     * The logic for finding the right update level is obviously complex
     *
     * There are two tables which we must consult: `tainted` for instance
     * specific tainted update level information, and `updates` for system-wide
     * update level (UL) information.
     *
     * The gist of the logic is this:
     *   * If the client has a tainted UL, we need to rollback to the next lowest
     *     non-tainted UL
     *   * Else if the client has an update level already, we need to provide
     *     them with the next incremental UL from where they are (e.g. 3 to 4,
     *     and 4 to 5)
     *   * Otherwise, we just want the latest and greatest UL in the channel.
     */

    return this.find({
      query: {
        $limit: 1,
        $sort: {
          id: 1,
        },
        id: {
          $gt: level,
        },
        channel: channel,
        tainted: false,
      },
    }).then(async (records) => {
      if (records.length === 0) {
        logger.debug('No records found, checking the tainteds table');
        /*
         * if we don't have a newer UL, and they're currently tainted, give
         * them an older one
         */
        records = await this.find({
          query: {
            $limit: 1,
            $sort: {
              id: -1,
            },
            channel: channel,
            tainted: false,
            id: {
              $notIn: Sequelize.literal(`
(SELECT "tainteds"."updateId" FROM "tainteds"
  WHERE
  ("tainteds"."uuid" = ${Sequelize.escape(id)}
    AND "tainteds"."updateId" = ${Sequelize.escape(level)}
  )
)`),
            },
          },
        });
        /*
         * If after all that we still have nothing, or we just got the same
         * update level back again, then there's no update for
         * the client
         */
        if ((records.length === 0) || (records[0].id == level)) {
          throw new NotModified('No updates presently available');
        }
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
    });
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
