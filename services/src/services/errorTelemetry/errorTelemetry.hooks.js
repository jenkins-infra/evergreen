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

  checkLogFormat(hook) {
    if(!hook) {
      throw new errors.BadRequest('No hook at all?');
    }
    logger.debug('HOOK DATA => ', hook.data);
    if(!(hook.data)) {
      throw new errors.BadRequest('Missing data');
    }
    if(!hook.data.log) {
      throw new errors.BadRequest('Missing log field');
    }
    errorTelemetryApiRequiredFields.forEach( field => {
      if(!hook.data.log[field]) {
        throw new errors.BadRequest(`Missing required field '${field}'`);
      }
    });
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
          ensureMatchingUUID,
          this.checkLogFormat
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
