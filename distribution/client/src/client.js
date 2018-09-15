/*
 * This is the main entrypoint for the evergreen-client
 */

const process = require('process');

const feathers = require('@feathersjs/feathers');
const logger   = require('winston');
const socketio = require('@feathersjs/socketio-client');
const auth     = require('@feathersjs/authentication-client');
const io       = require('socket.io-client');

const createCron     = require('./lib/periodic');
const ErrorTelemetry = require('./lib/error-telemetry');
const Registration   = require('./lib/registration');
const Status         = require('./lib/status');
const Storage        = require('./lib/storage');
const UI             = require('./lib/ui');
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
    this.status = new Status(this.app, { flavor: process.env.FLAVOR });
    this.update = new Update(this.app);
    this.errorTelemetry = new ErrorTelemetry(this.app, { flavor: process.env.FLAVOR });
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

    UI.publish(`Checking for updates from ${process.env.EVERGREEN_ENDPOINT}`);

    return this.update.query()
      .then(updates => this.update.applyUpdates(updates))
      .then(() => this.status.reportVersions())
      .then(() => this.status.reportLevel(this.update.getCurrentLevel()))
      .catch((err) => {
        if (err.type == 'invalid-json') {
          logger.warn('Received non-JSON response from the Update service');
        } else if (err.code == 304) {
          logger.debug('No updates available at this time');
        } else {
          UI.publish('Failed to query for updates!', { log: 'error', error: err });
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

    cron.runDaily('post-status', () => {
      this.status.reportVersions();
    });
    cron.runHourly('check-for-updates', () => {
      this.runUpdates();
    });

    try {
      this.errorTelemetry.setup();
    } catch (err) {
      logger.error('Failed to set up Error Telemetry, treating as non-fatal for now', err);
    }

    setInterval(() => {
      /* no-op to keep this process alive */
      const level = this.update.getCurrentLevel();
      logger.info('Reporting the current Update Level:', level);
      this.status.reportLevel(level);
    }, (5 * (60 * 1000)));
  }

  bootstrap() {
    const endpoint = process.env.EVERGREEN_ENDPOINT;
    logger.info('Configuring the client to use the endpoint %s', endpoint);
    this.socket = io(endpoint, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax : 5000,
      reconnectionAttempts: Infinity
    });
    this.app.configure(socketio(this.socket));

    this.app.configure(auth({
    }));

    this.app.on('reauthentication-error', (error) => {
      logger.info('Client must re-authenticate..', error);
      return this.reg.login();
    });

    logger.info('Registering listener for event: `update created`');
    this.app.service('update').on('created', (message) => {
      logger.info('Received an Update `created` event, checking for updates', message);
      this.runUpdates();
    });

    logger.info('Registering listener for event: `status ping`');
    this.app.service('status').on('ping', (message) => {
      logger.debug('Received ping', message);
    });

    this.socket.on('reconnect', () => {
      logger.info('Reconnecting the socket.io channel, and checking for updates');
      this.runUpdates();
    });

    this.reg.register().then((res, newRegistration) => {
      UI.publish('Registered this Evergreen instance', { log: 'debug', error: res} );
      this.status.authenticate(this.reg.uuid, this.reg.token);
      this.update.authenticate(this.reg.uuid, this.reg.token);
      this.errorTelemetry.authenticate(this.reg.uuid, this.reg.token);

      return this.status.create().then((r) => {
        logger.info('Starting the runloop with a new registration and status', r, newRegistration);
        this.runloop(this.app);
      });
    }).catch((err) => {
      UI.publish('Fatal error encountered while trying to register, exiting the client and will restart and retry', { log: 'error', error: err });
      process.exit(1);
    });
  }
}

module.exports = Client;

if (require.main === module) {
  Storage.setBootingFlag();
  UI.serve();
  /*
   * Allow the log level to be overridden in the environment for debugging
   * purposes by the user
   */
  logger.level = process.env.LOG_LEVEL || 'warn';
  /* Main entrypoint for module */
  UI.publish('Starting the evergreen-client..', { log: 'info' });
  let client = new Client();
  client.bootstrap();
}
