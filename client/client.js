/*
 * This is the main entryooint for the evergreen-client
 */

const logger       = require('winston');

const auth         = require('./lib/auth');
const registration = require('./lib/registration');

module.exports = {

  runloop: function(jwt) {
    logger.info('..starting runloop');
  },

  main: function() {
    if (registration.isRegistered()) {
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
  logger.info('Starting the evergreen-client..');
  module.exports.runloop();
}
