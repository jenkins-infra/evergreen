/*
 * This is the main entrypoint for the evergreen-client
 */

const process = require('process');

const feathers = require('@feathersjs/feathers');
const fetch    = require('node-fetch');
const logger   = require('winston');
const rest     = require('@feathersjs/rest-client');
const socketio = require('@feathersjs/socketio-client');
const io       = require('socket.io-client');

const createCron     = require('./lib/periodic');
const ErrorTelemetry = require('./lib/error-telemetry');
const Registration   = require('./lib/registration');
const Status         = require('./lib/status');
const Update         = require('./lib/update');


/*
 * The Client class is a simple wrapper meant to start the basics of the client
 * and then run a simple runloop to block the client from ever exiting
 */
class Client {
  constructor() {
    if (!process.env.FLAVOR) {
      logger.error('Fatal error encountered while trying to start, no flavor set, exiting the client');
      throw new Error('Missing flavor definition');
    }
    this.app = feathers();
    this.reg = new Registration(this.app);
    this.status = new Status(this.app, {flavor: process.env.FLAVOR});
    this.update = new Update(this.app);
    this.errorTelemetry = new ErrorTelemetry(this.app);
    this.updating = false;
    // This should be overridden on bootstrap
    this.socket = null;
  }

  /*
   * Determine whether the instance should be considered offline or not
   *
   * @return {boolean} Defaults to false unless EVERGREEN_OFFLINE=1 is et in
   *  the environment
   */
  isOffline() {
    return !!process.env.EVERGREEN_OFFLINE;
  }

  async runUpdates() {
    if (this.isOffline()) {
      logger.info('Evergreen in offline mode, disabling downloading of updates..');
      return false;
    }

    return this.update.query().then(updates => this.update.applyUpdates(updates)).catch((err) => {
      if (err.type == 'invalid-json') {
        logger.warn('Received non-JSON response from the Update service');
      } else {
        logger.error('Failed to query updates', err, err.code, err.data, err.error);
      }
    });
  }

  runloop(app) {
    logger.info('..starting runloop');
    /*
     * Only setting on the cron once we have registered and logged in,
     * otherwise it's not really useful to have anything running periodically
     */
    const cron = createCron(app);

    this.runUpdates();

    cron.runHourly('post-status', () => {
      // TODO: update status
    });
    cron.runDaily('check-for-updates', () => {
      this.runUpdates();
    });

    try {
      this.errorTelemetry.setup();
    } catch (err) {
      logger.error('Failed to set up Error Telemetry, treating as non-fatal for now', err);
    }

    setInterval(() => {
      /* no-op to keep this process alive */
    }, 1000);
  }

  bootstrap() {
    const endpoint = process.env.EVERGREEN_ENDPOINT;
    const restClient = rest(endpoint);

    logger.info('Configuring the client to use the endpoint %s', endpoint);
    this.app.configure(restClient.fetch(fetch));

    logger.info('Configuring the client for socket.io off %s', endpoint);
    this.socket = io(process.env.EVERGREEN_ENDPOINT);
    const socketApp = feathers();
    socketApp.configure(socketio(this.socket));

    logger.info('Registering listener for event: `update created`');
    socketApp.service('update').on('created', (message) => {
      logger.info('Received an Update `created` event, checking for updates', message);
      this.runUpdates();
    });

    logger.info('Registering listener for event: `status ping`');
    socketApp.service('status').on('ping', (message) => {
      logger.debug('Received ping', message);
    });

    this.reg.register().then((res, newRegistration) => {
      logger.debug('Registration returned', res);
      this.status.authenticate(this.reg.uuid, this.reg.token);
      this.update.authenticate(this.reg.uuid, this.reg.token);
      this.errorTelemetry.authenticate(this.reg.uuid, this.reg.token);

      return this.status.create().then((r) => {
        logger.info('Starting the runloop with a new registration and status', r, newRegistration);
        this.runloop(this.app);
      });
    }).catch((err) => {
      logger.info('Fatal error encountered while trying to register, exiting the client and will restart and retry', err);
      process.exit(1);
    });
  }
}

module.exports = Client;

if (require.main === module) {
  /*
   * Allow the log level to be overridden in the environment for debugging
   * purposes by the user
   */
  logger.level = process.env.LOG_LEVEL || 'warn';
  /* Main entrypoint for module */
  logger.info('Starting the evergreen-client..');
  let client = new Client();
  client.bootstrap();
}
