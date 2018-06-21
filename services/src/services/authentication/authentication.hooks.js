const errors      = require('@feathersjs/errors');
const ecc         = require('elliptic');
const logger      = require('winston');
const dbtimestamp = require('../../hooks/dbtimestamp');

class AuthenticationHooks {
  constructor() {
  }

  /*
   * Ensure that the request is valid
   */
  validateRequestParameters(context) {
    if ((!context.data.uuid) ||
      (!context.data.signature)) {
      throw new errors.BadRequest('Missing uuid and/or signature from request');
    }
    return context;
  }

  /*
   * Ensure that the uuid exists in the registration service
   */
  validateUUIDRegistered(context) {
    const reg = context.app.service('registration');
    return reg.find({ query: { uuid: context.data.uuid }}).then(records => {
      if (records.total < 1) {
        throw new errors.NotFound('Unknown instance');
      } else {
        /*
        * Since we've already looked up the UUID, let's pass it along for
        * future hook use
        */
        context.data.record = records.data[0];
      }
    }).catch((err) => {
      /* Expected that malformed uuids will throw a
      * `SequelizeDatabaseError`
      */
      logger.error('Authentication.create()', err);
      throw new errors.NotFound('Unknown instance');
    });
  }

  /*
   * Using the public key passed by the previous hook, ensure that the
   * signature of the UUID matches appropriately
   */
  validateSignature(context) {
    let record = context.data.record;
    let ec = new ecc.ec(record.curve);
    let key = ec.keyFromPublic(record.pubKey, 'hex');

    let invalidError = new errors.BadRequest('Invalid signature provided');

    try {
      if (!key.verify(record.uuid, context.data.signature)) {
        throw invalidError;
      }
    } catch (err) {
      logger.error('Improperly formed signature sent', err.message);
      throw invalidError;
    }
  }

  getHooks() {
    return {
      before: {
        all: [],
        find: [],
        get: [],
        create: [
          this.validateRequestParameters,
          this.validateUUIDRegistered,
          this.validateSignature,
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
  }
}

module.exports = new AuthenticationHooks();
