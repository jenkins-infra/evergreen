//!/usr/bin/env node

const EventSource  = require('eventsource');
const util         = require('util');

const registration = require('./lib/registration');

module.exports = {
  homeDirectory: function() {
    /* The default home directory is /evergreen, see the Dockerfile in the root
     * directory of th repository
     */
    if (!process.env.EVERGREEN_HOME) {
      return '/evergreen';
    }
    return process.env.EVERGREEN_HOME;
  },

  main: function() {
  },

};

if (require.main === module) {
  /* Main entrypoint for module */
}
