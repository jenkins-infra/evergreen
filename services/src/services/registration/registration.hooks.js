const dbtimestamp = require('../../hooks/dbtimestamp');
const internalOnly = require('../../hooks/internalonly');

module.exports = {
  before: {
    all: [],
    find: [
      internalOnly()
    ],
    get: [],
    create: [
      dbtimestamp('createdAt')
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
