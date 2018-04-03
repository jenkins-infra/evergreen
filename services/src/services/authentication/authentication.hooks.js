const errors      = require('@feathersjs/errors');
const dbtimestamp = require('../../hooks/dbtimestamp');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      dbtimestamp('createdAt'),
      (hook) => {
        if ((!hook.data.uuid) ||
          (!hook.data.signature)) {
          throw new errors.BadRequest('Missing uuid and/or signature from request');
        }
      }
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
