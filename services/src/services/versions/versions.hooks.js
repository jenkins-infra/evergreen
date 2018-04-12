const authentication     = require('@feathersjs/authentication');
const ensureMatchingUUID = require('../../hooks/ensureuuid');

module.exports = {
  before: {
    all: [
      authentication.hooks.authenticate(['jwt'])
    ],
    find: [],
    get: [],
    create: [
      ensureMatchingUUID,
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
