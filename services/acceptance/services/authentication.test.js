const assert  = require('assert');
const ecc     = require('elliptic');
const request = require('request-promise');
const url     = require('url');

const app     = require('../../src/app');
require('../rand-patch');

const port = app.get('port') || 3030;
const getUrl = pathname => url.format({
  hostname: app.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});

const assertStatus = function(response, code) {
  if (response.statusCode) {
    assert.equal(response.statusCode, code);
  }
  else {
    throw response;
  }
};

/* Generate a simple elliptic ECDSA keypair for testing */
const generateKeys = function() {
  let ec = new ecc.ec('secp256k1');
  return ec.genKeyPair();
};

describe('Authentication service acceptance tests', () => {
  beforeAll(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  afterAll(function(done) {
    this.server.close(done);
  });

  describe('create()', () => {
    it('should return a 400 for a malformed request', () => {
      return request({
        url: getUrl('/authentication'),
        method: 'POST'
      })
        .then(() => assert.fail('Got a 200 response'))
        .catch(res => assertStatus(res, 400));
    });

    it('should return a 404 if the client has not registered', () => {
      return request({
        url: getUrl('/authentication'),
        method: 'POST',
        json: true,
        body: {
          uuid: 'non-existent',
          signature: 'malarkey'
        }
      })
        .then(() => assert.fail('Got a 200 response'))
        .catch(res => assertStatus(res, 404));
    });

    it('should create a JWT token if the client has registered', async () => {
      const keys = generateKeys();
      const reg = await request({
        url: getUrl('/registration'),
        method: 'POST',
        json: true,
        body: {
          pubKey: keys.getPublic('hex'),
          curve: 'secp256k1'
        }
      });
      assert.ok(reg);
    });
  });
});
