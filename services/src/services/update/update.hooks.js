
const dbtimestamp        = require('../../hooks/dbtimestamp');
const ensureMatchingUUID = require('../../hooks/ensureuuid');
const internalOnly       = require('../../hooks/internalonly');
const authentication     = require('@feathersjs/authentication');
const internalApi        = require('../../hooks/internalapi');

class UpdateHooks {
  constructor() {
  }

  /*
   * For create() methods, add the default `channel` to the data which will be
   * "general" until richer channel management is added
   */
  defaultChannel(context) {
    context.data.channel = 'general';
    return context;
  }

  getHooks() {
    return {
      before: {
        all: [
        ],
        find: [
          internalOnly,
        ],
        get: [
          authentication.hooks.authenticate(['jwt']),
          ensureMatchingUUID,
        ],
        create: [
          internalApi,
          dbtimestamp('createdAt'),
          this.defaultChannel,
        ],
        update: [],
        patch: [],
        remove: [
          internalOnly,
        ],
      },

      after: {
        find: [
        ],
      },
      error: {}
    };
  }
}

module.exports = new UpdateHooks();
