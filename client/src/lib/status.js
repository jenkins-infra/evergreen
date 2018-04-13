/*
 * The status module is responsible for collecting and reporting the current
 * state of this instance to the Evergreen backend `Status` service
 */

const logger = require('winston');

class Status {
  constructor(app, options) {
    this.options = options || {};
    this.token = null;
    this.app = app;
  }

  /*
   * Return the timezone string for this client, e.g. America/Los_Angeles, UTC,
   * etc
   */
  getTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  authenticate(token) {
    this.token = token;
  }

  async create(uuid) {
    let api = this.app.service('status');
    let record = {
      uuid: uuid,
      timezone: this.getTimezone(),
    };
    return api.create(record, {
      headers: { Authorization: this.token }
    })
      .then((res) => {
        logger.info('Created a Status record with server side ID %d', res.id);
      })
      .catch((err) => {
        /* 400 errors are most likely attempts to recreate the same Status for
         * this instance.
         *
         * We need a better way to run a HEAD request to check before POSTing a
         * new status, but it's unclear whether that's supported in feathersjs
         * or not
         */
        if (err.code != 400) {
          logger.error('Failed to create a Status record', err);
        }
      });
  }
}

module.exports = Status;
