
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
  static initialize(sentryUrl) {
    if (!sentryUrl) {
      logger.error('No sentry url defined.');
      return;
    }
    Raven.config(sentryUrl).install();
  }

  /**
   * Send the JSON output to Sentry.io.  JSON format is from the Error Telemetry API.
   * @param {json} data
   */
  static sendOutput(data) {
    if (!data) {
      logger.error('Missing data.');
      return;
    }
    if (data.log.exception) {
      Raven.captureException(new Error(data.log.message), {
        level: data.log.level.toLowerCase(),
        logger: data.log.name,
        extra: {
          uuid: data.uuid,
          source: data.log
        }
      });
    } else {
      Raven.captureMessage(data.log.message, {
        level: data.log.level.toLowerCase(),
        logger: data.log.name,
        extra: {
          uuid: data.uuid,
          source: data.log
        }
      });
    }
  }
}

module.exports = Sentry;