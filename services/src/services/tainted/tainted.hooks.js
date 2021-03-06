const authentication     = require('@feathersjs/authentication');
const ensureMatchingUUID = require('../../hooks/ensureuuid');
const internalOnly       = require('../../hooks/internalonly');

class TaintedHooks {
  constructor() {
  }

  getHooks() {
    return {
      before: {
        all: [
          authentication.hooks.authenticate(['jwt'])
        ],
        find: [
          internalOnly
        ],
        get: [
          internalOnly
        ],
        create: [
          ensureMatchingUUID,
          /*
           * For API consistency we want clients to just send their level,
           * which is actually just an updateId :)
           */
          (context) => {
            context.data.updateId = context.data.level;
          },
        ],
        update: [
          internalOnly
        ],
        patch: [
          internalOnly
        ],
        remove: [
          internalOnly
        ],
      },
      after: {},
      error: {},
    };
  }
}

module.exports = new TaintedHooks();
