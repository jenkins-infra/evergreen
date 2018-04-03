const dbtimestamp = require('../../hooks/dbtimestamp');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [dbtimestamp('createdAt')],
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
