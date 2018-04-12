/*
 * The status module is responsible for collecting and reporting the current
 * state of this instance to the Evergreen backend `Status` service
 */

class Status {
  constructor(app, options) {
    this.options = options || {};
    this.app = app;
  }

  /*
   * Return the timezone string for this client, e.g. America/Los_Angeles, UTC,
   * etc
   */
  getTimezone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };
}

module.exports = Status;
