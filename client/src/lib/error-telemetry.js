/**
* The error telemetry module handles sending error logging to the backend.
*
* NOTE: we _might_ want in the future to have only one Telemetry class and
* handle both error and "metrics" telemetry, but let's start with a smaller
* scope at least for now.
*/
const Tail   = require('tail').Tail;
const fs     = require('fs');
const logger = require('winston');

class ErrorTelemetry {
  constructor(app, options) {
    this.app = app;
    this.options = options;
  }

  authenticate(uuid, token) {
    this.uuid = uuid;
    this.token = token;
    return this;
  }

  /**
  * (Private) default behaviour for the output where to send data to when the watched logging file
  * has a modification detected.
  */
  callErrorTelemetryService(app, logDataObject, uuid, token) {

    const api = app.service('telemetry/error');

    const payload = {
      log: logDataObject,
      uuid: uuid
    };
    return api.create(
      payload
      ,
      {
        headers: { Authorization: token }
      }
    ).then((res) => {
      logger.info('pushed as ', res);
    }).catch((res) => {
      logger.error('Failed to push log:', res);
    });
  }

  /**
  * monitoredFile: path to the log file to watch
  * outputFunction(app,line): the function that will be called on each new line detected
  */
  setup(monitoredFile, outputFunction=this.callErrorTelemetryService) {
    logger.info('Setting up error logging...');

    let loggingFile = '';
    if(monitoredFile) {
      loggingFile = monitoredFile;
    } else {
      loggingFile = this.fileToWatch();
    }

    if(!fs.existsSync(loggingFile)) {
      logger.warn(`Logging file ${loggingFile} not found. Still watching the path in case the file gets created later. Can be normal when starting up.`);
    } else {
      logger.info(`Watching ${loggingFile}`);
    }

    const tail = new Tail(loggingFile, {
      follow: true,
      fromBeginning: true
    });

    tail.on('line', data => {
      logger.debug('Reading line:', data);

      try {
        outputFunction(this.app, JSON.parse(data), this.uuid, this.token);
      } catch(err) {
        logger.error(`Unable to parse as JSON, corrupt log line? ***${data}***`, err);
      }
    });

    tail.on('error', error => {
      logger.error('Error while setting up file watching:', error);
    });

    logger.info('Error Telemetry Logging file watching configured');
  }

  fileToWatch() {
    let path = '';
    if(!process.env.ESSENTIALS_LOG_FILE) {
      logger.debug('Defaulting to essentials.log.0');
      path = '/evergreen/jenkins/var/logs/essentials.log.0';
    } else {
      path = process.env.ESSENTIALS_LOG_FILE;
    }
    return path;
  }
}

module.exports = ErrorTelemetry;
