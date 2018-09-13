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
