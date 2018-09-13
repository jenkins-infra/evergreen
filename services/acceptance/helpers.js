/*
 * This module contains functions which are helpful for running all acceptance
 * tests
 */
const ecc     = require('elliptic');
const request = require('request-promise');
const url     = require('url');
const app     = require('../src/app');

require('./rand-patch');

class Helpers {
  constructor () {
    this.curve = 'secp256k1';
  }

  startApp(callback) {
    this.server = app.listen(this.port());
    this.server.once('listening', () => callback());
  }

  stopApp(callback) {
    this.server.close(callback);
  }

  port() {
    /* offset a bit so `make run` and `make acceptance` can be run at the same
     * time
     */
    return (app.get('port') || 3030) + 24;
  }

  getUrl(pathname) {
    return url.format({
      hostname: app.get('host') || 'localhost',
      protocol: 'http',
      port: this.port(),
      pathname
    });
  }

  /*
   * Generate a simple elliptic ECDSA keypair for testing
   *
   * Typically only used when performing mock client operations
   */
  generateKeys() {
    let ec = new ecc.ec(this.curve);
    return ec.genKeyPair();
  }

  /*
   * Execute a registration for the given set of keys
   *
   * @return a registration response object
   */
  async register(keys) {
    return await request({
      url: this.getUrl('/registration'),
      method: 'POST',
      json: true,
      body: {
        pubKey: keys.getPublic('hex'),
        curve: this.curve
      }
    });
  }

  async registerAndAuthenticate() {
    this.keys = this.generateKeys();
    this.reg = await this.register(this.keys);

    const signature = this.keys.sign(this.reg.uuid);
    const response = await request({
      url: this.getUrl('/authentication'),
      method: 'POST',
      json: true,
      body: {
        strategy: 'local',
        uuid: this.reg.uuid,
        signature: signature
      }
    });
    this.token = response.accessToken;

    return { token: this.token, uuid: this.reg.uuid };
  }
}

module.exports = new Helpers();
