/*
 * The UI module is what is responsible for preparing data to be served by the
 * client front-end, which is expected to be a single page web application with
 * as ocket.io connection to this module
 */

const feathers      = require('@feathersjs/feathers');
const express       = require('@feathersjs/express');
const socketio      = require('@feathersjs/socketio');
const configuration = require('@feathersjs/configuration');
const logger        = require('winston');

/*
 * Simple shim feathers service just to enable events
 */
class MessageService {
  constructor(app) {
    this.app = app;
    this.recent = [];
  }

  async find() {
    return this.recent;
  }

  async create(data, params) {
    if (params.log) {
      logger[params.log](data, params.error);
    } else {
      logger.debug('Publishing to the UI:', data, params);
    }
    this.recent.push(data);
    // Only keep the last 100 items
    this.recent = this.recent.slice(-100);
    return Promise.resolve(data);
  }
}

class UI {
  constructor() {
    const app = express(feathers());
    this.app = app;

    app.configure(configuration());
    app.configure(express.rest());
    app.configure(socketio());
    app.use('/', express.static(__dirname + app.get('public')));

    app.use(express.notFound());
    app.use('messages', new MessageService(app));

    /*
     * Set up the socket.io channel
     */
    app.on('connection', conn => this.app.channel('anonymous').join(conn));
    // Publish all events into the anonymous channel
    app.publish(() => app.channel('anonymous'));
  }

  /*
   * Publish is an explicit method rather than hooking behavior in the winston
   * logger because not everything that should be in the logs should
   * necessarily be presented to the user.
   *
   */
  publish(message, params) {
    return this.app.service('messages').create({
      message: message,
      timestamp: Date.now(),
    }, params);
  }

  serve() {
    this.server = this.app.listen(this.app.get('port'));
    return this;
  }
}

module.exports = new UI();
