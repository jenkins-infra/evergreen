const assert  = require('assert');
const ecc     = require('elliptic');
const request = require('request-promise');
const logger  = require('winston');

const h       = require('../helpers');

/* Generate a simple elliptic ECDSA keypair for testing */
const generateKeys = function() {
  let ec = new ecc.ec('secp256k1');
  return ec.genKeyPair();
};

describe('Authentication service acceptance tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

  describe('create()', () => {
    it('should return a 400 for a malformed request', () => {
      return request({
        url: h.getUrl('/authentication'),
        method: 'POST'
      })
        .then(() => assert.fail('Got a 200 response'))
        .catch(res => h.assertStatus(res, 400));
    });

    it('should return a 404 if the client has not registered', () => {
      return request({
        url: h.getUrl('/authentication'),
        method: 'POST',
        json: true,
        body: {
          uuid: 'non-existent',
          signature: 'malarkey'
        }
      })
        .then(() => assert.fail('Got a 200 response'))
        .catch(res => h.assertStatus(res, 404));
    });

    describe('with a pre-existing registration', () => {
      beforeEach(async () => {
        this.keys = generateKeys();
        this.reg = await request({
          url: h.getUrl('/registration'),
          method: 'POST',
          json: true,
          body: {
            pubKey: this.keys.getPublic('hex'),
            curve: 'secp256k1'
          }
        });
      });

      it('should fail to create a JWT token with an invalid signature', () => {
        return request({
          url: h.getUrl('/authentication'),
          method: 'POST',
          json: true,
          body: {
            uuid: this.reg.uuid,
            signature: 'malarkey'
          }
        })
          .then(() => assert.fail('Should not have succeeded'))
          .catch((err) => assert.equal(err.statusCode, 400));
      });

      it('should create a JWT token if the client has registered', async () => {
        assert.ok(this.reg.uuid, 'Failed to register a valid UUID which we can use');
        /* Make a signature of our registered UUID */
        const signature = this.keys.sign(this.reg.uuid);
        const auth = await request({
          url: h.getUrl('/authentication'),
          method: 'POST',
          json: true,
          body: {
            uuid: this.reg.uuid,
            signature: signature
          }
        });
        /* ensure this response looks somewhat tokeny? */
        assert.ok(auth);
      });
    });
  });
});
