/*
 * This is the main entrypoint for the evergreen-client
 */

const feathers     = require('@feathersjs/feathers');
const fetch        = require('node-fetch');
const logger       = require('winston');
const rest         = require('@feathersjs/rest-client');

const createCron   = require('./lib/periodic');
const Registration = require('./lib/registration');
const Status       = require('./lib/status');

/*
 * The Client class is a simple wrapper meant to start the basics of the client
 * and then run a simple runloop to block the client from ever exiting
 */
class Client {
  constructor() {
    this.app = feathers();
    this.reg = new Registration(this.app);
    this.status = new Status(this.app);
  }

  runloop(app, token) {
    logger.info('..starting runloop');
    /*
     * Only setting on the cron once we have registered and logged in,
     * otherwise it's not really useful to have anything running periodically
     */
    createCron(app);
    this.status.authenticate(token);
    this.status.create(this.reg.uuid);
    setInterval(function() {
      /* no-op to keep this process alive */
    }, 10);
  }

  bootstrap() {
    const endpoint = process.env.EVERGREEN_ENDPOINT;
    const restClient = rest(endpoint);

    logger.info('Configuring the client to use the endpoint %s', endpoint);
    this.app.configure(restClient.fetch(fetch));

    this.reg.register().then((res) => {
      logger.debug('Registration returned', res);
      /*
       * It is only valid to start the runloop assuming we have been able to
       * register and log in successfully, otherwise the client will exit and
       * supervisord should try again :/
       */
      this.runloop(this.app, this.reg.token);
    });
  }
}

module.exports = Client;

if (require.main === module) {
  /* Main entrypoint for module */
  logger.info('Starting the evergreen-client..');
  let client = new Client();
  client.bootstrap();
}
