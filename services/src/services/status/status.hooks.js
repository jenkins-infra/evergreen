/*
 * Status service hooks
 */

const authentication     = require('@feathersjs/authentication');
const internalOnly       = require('../../hooks/internalonly');
const ensureMatchingUUID = require('../../hooks/ensureuuid');

module.exports = {};

/*
 * Augment the inbound data to include the default channel, presumed to be
 * `general`
 */
module.exports.defaultChannel = function(context) {
  context.data.channelId = 3;
  return context;
};

module.exports.includeAssociations = function(context) {
  if (!context.params.sequelize) {
    context.params.sequelize = {};
  }
  Object.assign(context.params.sequelize, {
    include: [ context.app.get('models').channel ]
  });
  return context;
};

module.exports.pruneQueryParams = function(context) {
  /*
   * delete extra parameters included in the query string
   */
  if (context.params.query) {
    delete context.params.query.include;
  }
  return context;
};



Object.assign(module.exports, {
  before: {
    all: [
      authentication.hooks.authenticate(['jwt'])
    ],
    find: [
    ],
    get: [
      module.exports.includeAssociations,
    ],

    create: [
      ensureMatchingUUID,
      module.exports.defaultChannel,
      module.exports.pruneQueryParams
    ],

    update: [
      ensureMatchingUUID,
    ],
    patch: [
      ensureMatchingUUID,
    ],
    remove: [
      internalOnly
    ]
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
});
