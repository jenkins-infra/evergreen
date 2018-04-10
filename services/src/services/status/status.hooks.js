/*
 * Status service hooks
 */

const authentication = require('@feathersjs/authentication');

module.exports = {
  before: {
    all: [
      authentication.hooks.authenticate(['jwt'])
    ],
    find: [
    ],
    get: [
      (context) => {
        if (!context.params.sequelize) {
          context.params.sequelize = {};
        }
        Object.assign(context.params.sequelize, {
          include: [ context.app.get('models').channel ]
        });

        /*
         * delete extra parameters included in the query string
         */
        if (context.params.query) {
          delete context.params.query.include;
        }
        return context;
      }
    ],

    create: [
      (context) => {
        context.data.channelId = 3;
        return context;
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
