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

  runloop: function(jwt) {
  },

  main: function() {
    /* If we already have keys then all we need to do is log in */
    if (registration.hasKeys()) {
      auth.login(registration.identity()).then((err, jwt) => {
        /* Check error for login, if fail, then we need to update the status
         */
        if (!err) { runloop(jwt); }
      });
    }
    else {
      registration.register().then((err) => {
        /* Check error on registration, then we need to update the status.
         */
        if (!err) {
          auth.login(registration.identity()).then((lerr, jwt) => {
            if (!lerr) { runloop(jwt); }
          });
        }
      });
    }
  },
};

if (require.main === module) {
  /* Main entrypoint for module */
}
