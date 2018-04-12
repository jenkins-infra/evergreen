/*
 * This is the main entrypoint for the evergreen-client
 */

const feathers     = require('@feathersjs/feathers');
const fetch        = require('node-fetch');
const logger       = require('winston');
const rest         = require('@feathersjs/rest-client');

const auth         = require('./lib/auth');
const createCron   = require('./lib/periodic');
const Registration = require('./lib/registration');

module.exports = {
  runloop: function(app, jwt) {
    logger.info('..starting runloop');
    /*
     * Only setting on the cron once we have registered and logged in,
     * otherwise it's not really useful to have anything running periodically
     */
    let cron = createCron(app);
  },

  main: async function() {
    const app = feathers();
    const reg = new Registration(app);
    const restClient = rest(process.env.EVERGREEN_ENDPOINT);
    app.configure(restClient.fetch(fetch));

    if (reg.isRegistered()) {
      auth.login(reg.identity()).then((err, jwt) => {
        /* Check error for login, if fail, then we need to update the status
         */
        if (!err) { runloop(app, jwt); }
      });
    }
    else {
      logger.info('Registering..');
      reg.register().then((res) => {
        /* successfully created registration */
      }).catch((err) => {
        logger.error('Failed to complete a registration, what do we do!', err);
      });
    }
  },
};

if (require.main === module) {
  /* Main entrypoint for module */
  logger.info('Starting the evergreen-client..');
  module.exports.main();
  setInterval(function() {
    /* no-op to keep this process alive */
  }, 10);
}
