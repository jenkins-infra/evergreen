/*
 * This is the main entrypoint for the evergreen-client
 */

import feathers from '@feathersjs/feathers';
import * as logger from 'winston';
import socketio from '@feathersjs/socketio-client';
import auth from '@feathersjs/authentication-client';
import io from 'socket.io-client';

import ErrorTelemetry from './lib/error-telemetry';
import HealthChecker from './lib/healthchecker';
import Registration from './lib/registration';
import Status from './lib/status';
import Storage from './lib/storage';
import UI from './lib/ui'
import Update from './lib/update';
import Periodic from './lib/periodic';

/*
 * The Client class is a simple wrapper meant to start the basics of the client
 * and then run a simple runloop to block the client from ever exiting
 */
export default class Client {
  protected readonly app : any;
  protected readonly reg : Registration;
  protected readonly healthChecker : HealthChecker;
  protected readonly update : Update;
  protected readonly status : Status;
  protected readonly errorTelemetry : ErrorTelemetry;

  protected socket : any;

  public updating : boolean;

  constructor() {
    if (!process.env.FLAVOR) {
      logger.error('Fatal error encountered while trying to start, no flavor set, exiting the client');
      throw new Error('Missing flavor definition');
    }
    this.app = feathers();
    this.reg = new Registration(this.app);
    this.healthChecker = new HealthChecker(process.env.JENKINS_URL || 'http://127.0.0.1:8080');
    this.status = new Status(this.app, { flavor: process.env.FLAVOR });
    this.update = new Update(this.app, { healthChecker: this.healthChecker, status: this.status });
    this.errorTelemetry = new ErrorTelemetry(this.app, this.update, { flavor: process.env.FLAVOR });
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
          logger.warn('error during update (already in progress maybe?)');
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
    const cron = new Periodic();

    this.runUpdates();

    this.healthChecker.check().then(() => {
      UI.publish('Jenkins appears to be online', { log: 'info' });
      Storage.removeBootingFlag();
    }).catch((error) => {
      UI.publish('Jenkins appears to be in an unhealthy state (startup auto-healthcheck)!', { log: 'error' });
    });

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
      /* keep this process alive */
      this.tick();
    }, (5 * (60 * 1000)));
  }

  tick() {
    const level = this.update.getCurrentLevel();
    this.status.reportLevel(level);
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

    this.reg.register().then(({res, newRegistration}) => {
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

if (require.main === module) {
  Storage.setBootingFlag();
  UI.serve();
  /*
   * Allow the log level to be overridden in the environment for debugging
   * purposes by the user
   */
  (logger as any).level = process.env.LOG_LEVEL || 'warn';
  /* Main entrypoint for module */
  UI.publish('Starting the evergreen-client..', { log: 'info' });
  const client = new Client();
  client.bootstrap();
}
