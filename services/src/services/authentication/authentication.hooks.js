const errors      = require('@feathersjs/errors');
const logger      = require('winston');
const dbtimestamp = require('../../hooks/dbtimestamp');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      /* Ensure that the request is valid
       */
      (hook) => {
        if ((!hook.data.uuid) ||
          (!hook.data.signature)) {
          throw new errors.BadRequest('Missing uuid and/or signature from request');
        }
      },
      /* Ensure that the uuid actually exists in the registration service
       */
      (hook) => {
        const reg = hook.app.service('registration');
        return reg.find({ query: { uuid: hook.data.uuid }}).then(records => {
          if (records.total < 1) {
            throw new errors.NotFound('Unknown instance');
          }
        }).catch((err) => {
          /* Expected that malformed uuids will throw a
           * `SequelizeDatabaseError`
           */
          logger.error('Authentication.create()', err.message);
          throw new errors.NotFound('Unknown instance');
        });
      },
      dbtimestamp('createdAt'),
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
