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

const TARGET = '/tmp/test';

class ErrorTelemetry {
  constructor(app, options) {
    this.app = app;
    this.options = options;
  }

  setup() {
    logger.info('Setting up error logging...');
    const loggingFile = this.fileToWatch();

    if(!fs.existsSync(loggingFile)) {
      logger.warn(`Logging file ${loggingFile} not found. Still watching the path in case the file gets created later. Can be normal when starting up.`);
    } else {
      logger.info(`Watching ${loggingFile} and output to ${TARGET}`);
    }

    const tail = new Tail(loggingFile, {
      follow: true,
      fromBeginning: true
    });

    tail.on('line', data => {
      const json = JSON.parse(data);

      const text = `MESSAGE=${json.message}\n`;
      fs.appendFile(TARGET, text, err => {
        if(err) {
          return logger.error(`Error writing file! ${err}`);
        }
        logger.info('The file was written!' + data);
      });
    });

    tail.on('error', error => {
      logger.error(`ERROR watching file: ${error}`);
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
