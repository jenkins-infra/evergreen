const authentication     = require('@feathersjs/authentication');
const ensureMatchingUUID = require('../../hooks/ensureuuid');
const hash               = require('object-hash');

class VersionsHooks {
  constructor() {
  }

  getHooks() {
    return {
      before: {
        all: [
          authentication.hooks.authenticate(['jwt'])
        ],
        find: [],
        get: [],
        create: [
          ensureMatchingUUID,
          this.computeManifestChecksum,
        ],
        update: [],
        patch: [],
        remove: []
      },
      after: {},
      error: {},
    };
  }


  /*
   * This function will compute the checksum of the manifest sent to the
   * backend
   */
  computeManifestChecksum(context) {
    context.data.checksum = hash.MD5(context.data.manifest);
    return context;
  }
}

module.exports = new VersionsHooks();
