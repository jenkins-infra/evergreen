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
        await this.prepareManifestWithFlavor(id, record, computed);
        await this.filterVersionsForClient(id, record, computed);
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
      await this.prepareManifestWithFlavor(id, record, computed);
      await this.filterVersionsForClient(id, record, computed);
      return computed;
    });
  }

  /*
   * Use the latest versions from the client to filter out updates which are
   * not necessary
   */
  async filterVersionsForClient(id, record, computedManifest) {
    let clientVersions = await this.app.service('versions').find({
      query: {
        uuid: id,
        $limit: 1
      },
    });
    /*
     * If we have a version (not guaranteed on a fresh installation)
     * then we need to merge the changes to make sure we're only sending the
     * client the updates they need
     */
    if (clientVersions.length != 1) {
      return false;
    }
    let latestClientVersion = clientVersions[0];

    if (latestClientVersion.manifest.jenkins.core == record.manifest.core.checksum.signature) {
      computedManifest.core = {};
    }

    if (Object.keys(latestClientVersion.manifest.jenkins.plugins).length != 0) {
      let signatures = Object.values(latestClientVersion.manifest.jenkins.plugins);
      let artifactIds = record.manifest.plugins.map(p => p.artifactId);
      let updates = [];
      let deletes = [];
      record.manifest.plugins.forEach((plugin) => {
        if (!signatures.includes(plugin.checksum.signature)) {
          updates.push(plugin);
        }
      });
      Object.keys(latestClientVersion.manifest.jenkins.plugins).forEach((artifactId) => {
        if (!artifactIds.includes(artifactId)) {
          deletes.push(artifactId);
        }
      });
      computedManifest.plugins.updates = updates;
      computedManifest.plugins.deletes = deletes;
    }

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
  async prepareManifestWithFlavor(id, record, computedManifest) {
    const instance = await this.app.service('status').get(id);

    if (!instance) {
      return computedManifest;
    }

    if ((!instance.flavor) || (!record.manifest) || (!record.manifest.environments)) {
      return computedManifest;
    }

    let flavor = record.manifest.environments[instance.flavor];
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
