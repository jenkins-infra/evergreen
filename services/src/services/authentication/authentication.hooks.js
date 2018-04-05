const errors      = require('@feathersjs/errors');
const ecc         = require('elliptic');
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
          else {
            /* Since we've already looked up the UUID, let's pass it along for
             * future hook use
             */
            let record = records.data[0];
            if (!hook.result) {
              hook.result = record;
            }
            else {
              hook.result = Object.assign(hook.result, record);
            }
          }
        }).catch((err) => {
          /* Expected that malformed uuids will throw a
           * `SequelizeDatabaseError`
           */
          logger.error('Authentication.create()', err);
          throw new errors.NotFound('Unknown instance');
        });
      },

      /*
       * Using the public key passed by the previous hook, ensure that the
       * signature of the UUID matches appropriately
       */
      (hook) => {
        let record = hook.result;
        let ec = new ecc.ec(record.curve);
        let key = ec.keyFromPublic(record.pubKey, 'hex');

        let invalidError = new errors.BadRequest('Invalid signature provided');

        try {
          if (!key.verify(record.uuid, hook.data.signature)) {
            throw invalidError;
          }
        }
        catch (err) {
          logger.error('Improperly formed signature sent', err.message);
          throw invalidError;
        }
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
