/*
 * Status service hooks
 */

const authentication     = require('@feathersjs/authentication');
const internalOnly       = require('../../hooks/internalonly');
const ensureMatchingUUID = require('../../hooks/ensureuuid');

/*
 * To make things easier to unit test, these hook functions are being exported
 */
module.exports = {};

/*
 * Include the model's associations in the output from the hook
 */
module.exports.includeAssociations = function(context) {
  if (!context.params.sequelize) {
    context.params.sequelize = {};
  }
  Object.assign(context.params.sequelize, {
    include: [ context.app.get('models').update ]
  });
  return context;
};

/*
  * delete extra parameters included in the query string
  */
module.exports.pruneQueryParams = function(context) {
  if (context.params.query) {
    delete context.params.query.include;
  }
  return context;
};


/*
 * Default new instances into the latest update record in the `general` channel.
 */
module.exports.defaultUpdateLevel = async function(context) {
  const updates = context.app.service('update');
  const result = await updates.find({
    query: {
      tainted: false,
      channel: 'general',
      $limit: 1,
      $sort: {
        createdAt: -1,
      }
    },
  });

  if (result.total == 0) {
    throw new Error('Failed to find the latest `general` updates for instance creation');
  }
  /*
    * The result returned is a paginated object
    */
  context.data.updateId = result.data[0].id;
  return context;
};


/*
 * mash everything into module.exports for easy of use in the service
 * definition
 */
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
      module.exports.defaultUpdateLevel,
      module.exports.pruneQueryParams,
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
