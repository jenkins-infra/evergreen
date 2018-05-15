const errors      = require('@feathersjs/errors');

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
        all: [],
        find: [],
        get: [],
        create: [
          // JEP XXX Error Telemetry API
          (hook) => {
            /* eslint-disable no-console */
            //console.log('HOOK => ', hook);
            if(!(hook.data.log)) {
              throw new errors.BadRequest('Missing log field');
            }
            if(!(hook.data.log instanceof Object)) {
              throw new errors.BadRequest('log should be an object');
            }
            errorTelemetryApiRequiredFields.forEach( field => {
              if(!hook.data.log[field]) {
                throw new errors.BadRequest(`Missing required field '${field}'`);
              }
            });
          }
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
