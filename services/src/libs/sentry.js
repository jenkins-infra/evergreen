
const logger    = require('winston');
const Raven     = require('raven');


/**
 * The sentry module is responsible for passing messages along to
 * the sentry.io server.
 */
class Sentry {
  /**
   * Initializes the Sentry library with the URL to connect to.  This must be called at App startup.
   *
   * @param {string} sentryUrl
   */
  constructor(sentryUrl) {
    if (!sentryUrl) {
      logger.error('No sentry url defined.');
      return;
    }
    this.raven = new Raven.Client();
    this.raven.config(sentryUrl);
  }

  /**
   * Map java.util.logging log levels to Sentry.io log levels.
   * If the level is missing or invalid, the fallback is "info".
   * @param {string} level
   * @see {@link https://docs.oracle.com/javase/8/docs/api/java/util/logging/Level.html|java.util.logging.Level}
   * @see {@link https://docs.sentry.io/clients/node/usage/#raven-node-additional-data|Sentry.io - Raven - additional data}
   */
  mapJavaLogLevel(level) {
    if (!level) {
      logger.error('Missing log level.');
      return 'info';
    }

    switch (level.toUpperCase()) {
    case 'SEVERE':
      return 'error';
    case 'WARNING':
      return 'warning';
    case 'INFO':
    case 'CONFIG':
      return 'info';
    case 'FINE':
    case 'FINER':
    case 'FINEST':
      return 'debug';
    default:
      logger.warn(`Unknown log level "${level}", using "info"`);
      return 'info';
    }
  }

  /**
   * Send the JSON output to Sentry.io.  JSON format is from the Error Telemetry API.
   * @param {json} data
   */
  sendOutput(data) {
    if (!data) {
      logger.error('Missing data.');
      return;
    }

    const errorData = {
      level: this.mapJavaLogLevel(data.log.level),
      logger: data.log.name,
      user: {
        /*
         * Different docs on sentry.io suggest different fields here, so why
         * not both?
         */
        id: data.uuid,
        name: data.uuid,
      },
      extra: {
        id: data.uuid,
        uuid: data.uuid,
        source: data.log,
        flavor: data.flavor,
        updateLevel: data.updateLevel
      },
    };

    if (data.log.exception) {
      this.raven.captureException(new Error(data.log.message), errorData);
    } else {
      this.raven.captureMessage(data.log.message, errorData);
    }
  }
}

module.exports = Sentry;
