/*
 * The sentry module is responsible for passing messages along to
 * the sentry server.
 */

const logger    = require('winston');
const Raven     = require('raven');


class Sentry {
  static initialize(sentryUrl) {
    if (!sentryUrl) {
      logger.error('No sentry url defined.');
      return;
    }
    Raven.config(sentryUrl).install();
  }

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