const errors      = require('@feathersjs/errors');
const logger = require('winston');
const authentication     = require('@feathersjs/authentication');
const ensureMatchingUUID = require('../../hooks/ensureuuid');

const errorTelemetryApiRequiredFields = [
  'version',
  'timestamp',
  'name',
  'level',
  'message'
];

class ErrorTelemetryHooks {
  constructor() {
  }

  getHooks() {
    return {
      before: {
        all: [
          authentication.hooks.authenticate(['jwt'])
        ],
        find: [],
        get: [],
        create: [
          // JEP XXX Error Telemetry API
          (hook) => {
            logger.debug('HOOK DATA => ', hook.data);
            if(!(hook.data.log)) {
              throw new errors.BadRequest('Missing log field');
            }
            errorTelemetryApiRequiredFields.forEach( field => {
              if(!hook.data.log[field]) {
                throw new errors.BadRequest(`Missing required field '${field}'`);
              }
            });
          },
          ensureMatchingUUID
        ],
        update: [],
        patch: [],
        remove: []
      },
      after: {},
      error: {},
    };
  }
}

module.exports = new ErrorTelemetryHooks();
