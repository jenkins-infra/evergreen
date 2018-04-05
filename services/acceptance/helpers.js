/*
 * This module contains functions which are helpful for running all acceptance
 * tests
 */
const assert = require('assert');
const url    = require('url');
const app    = require('../src/app');

require('./rand-patch');

class Helpers {
  constructor (options) {
  }

  startApp(callback) {
    this.server = app.listen(this.port());
    this.server.once('listening', () => callback());
  }

  stopApp(callback) {
    this.server.close(callback);
  }

  port() {
    return app.get('port') || 3030;
  }

  getUrl(pathname) {
    return url.format({
      hostname: app.get('host') || 'localhost',
      protocol: 'http',
      port: this.port(),
      pathname
    });
  }

  assertStatus(response, code) {
    if (response.statusCode) {
      assert.equal(response.statusCode, code);
    }
    else {
      throw response;
    }
  }
}

module.exports = new Helpers();
