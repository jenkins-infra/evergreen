/*
 * Status service hooks
 */

const authentication = require('@feathersjs/authentication');
const errors         = require('@feathersjs/errors');
const logger         = require('winston');

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

/* Ensure that the given UUID matches the UUID inside of the JWT
 */
module.exports.ensureMatchUUID = function(context) {
  if (!context.data.uuid) {
    logger.error('Receiving a request without a valid UUID', context.data);
    throw new errors.BadRequest('Invalid UUID');
  }

  logger.error('payload', context.params.payload);
  if (context.data.uuid != context.params.payload.uuid) {
    logger.error('Receiving a request with to modify a UUID not matching the token (%s/%s)',
      context.data.uuid,
      context.params.payload.uuid);
    throw new errors.NotAuthenticated('Invalid UUID');
  }

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
      module.exports.ensureMatchUUID,
      module.exports.defaultChannel,
      module.exports.pruneQueryParams
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
});
