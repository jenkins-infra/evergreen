const fs     = require('fs');
const logger = require('winston');
const path   = require('path');
const mkdirp = require('mkdirp');
const sentry = require('../../libs/sentry');

class ErrorTelemetryService {
  constructor() {
    if (process.env.NODE_ENV == 'production') {
      logger.info('production mode: no file used for error telemetry logging');
    } else {
      this.loggingFile = '/tmp/error-telemetry-testing.log';
      const baseDirectory = path.dirname(this.loggingFile);
      if (!fs.existsSync(baseDirectory)) {
        logger.warn(`${baseDirectory} does not exist, trying to create it.`);
        mkdirp(baseDirectory);
      }
      logger.warn(`Testing mode: ${baseDirectory} will push received logs to ${this.loggingFile} file`);
    }
  }
  create(data) {
    // Should be impossible because it passed the hooks step
    if (!data) {
      return Promise.reject({status:'KO'});
    }

    // Only for testing, file logging of error telemetry is disabled in production
    if (this.loggingFile) {
      const toWrite = `${new Date()} => ${JSON.stringify(data)}\n\n`;
      fs.appendFileSync(this.loggingFile, toWrite);
    }
    sentry.sendOutput(data);

    return Promise.resolve({status:'OK'});
  }
}

module.exports = function() {
  return new ErrorTelemetryService();
};
module.exports.ErrorTelemetryService = ErrorTelemetryService;
