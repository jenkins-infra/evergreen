const uuid         = require('uuid/v4');
const logger       = require('winston');

const dbtimestamp  = require('../../hooks/dbtimestamp');
const internalOnly = require('../../hooks/internalonly');

module.exports = {
  before: {
    all: [
      internalOnly()
    ],
    find: [
      internalOnly()
    ],
    get: [
      internalOnly()
    ],
    create: [
      dbtimestamp('createdAt'),

      (hook) => {
        hook.data.uuid = uuid();
        logger.debug('Generating uuid for registration.create', hook.data);
        return hook;
      }
    ],
    update: [
      internalOnly()
    ],
    patch: [
      internalOnly()
    ],
    remove: [
      internalOnly()
    ],
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
