const assert  = require('assert');
const request = require('request-promise');
const h       = require('../helpers');

describe('Error Telemetry service acceptance tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

  describe('without registration', () => {
    it('should not allow unauthorized access', () => {
      return request({
        url: h.getUrl('/telemetry/error'),
        json: true,
        method: 'POST'
      })
        .then(() => assert.fail('This should not have succeeded'))
        .catch((err) => h.assertStatus(err, 401));
    });
  });

  describe('with a pre-existing registration', () => {
    beforeEach(async () => {
      this.keys = h.generateKeys();
      this.reg = await h.register(this.keys);
    });

    describe('and an auth token', () => {
      beforeEach(async () => {
        const signature = this.keys.sign(this.reg.uuid);
        this.token = await request({
          url: h.getUrl('/authentication'),
          method: 'POST',
          json: true,
          body: {
            uuid: this.reg.uuid,
            signature: signature
          }
        });
      });

      it('should reject bad logs', () => {
        let emptyLog = {
          uuid: this.reg.uuid,
          log: 'timestamp'
        };
        return request({
          url: h.getUrl('/telemetry/error'),
          method: 'POST',
          headers: { 'Authorization': this.token },
          json: true,
          body: emptyLog
        })
          .then(res => assert.fail(res))
          .catch(err => {
            assert.equal(err.statusCode, 400);
            assert.equal(err.error.status, 'ERROR', 'response.status should be ERROR but got: ' + err.error.status);
            assert.equal(err.error.message, 'Missing required field \'version\'', 'response.message got: ' + err.error.message);
          });
      });

      it('should reject invalid json', () => {
        return request({
          url: h.getUrl('/telemetry/error'),
          method: 'POST',
          headers: { 'Authorization': this.token },
          json: true,
          body: 'invalid json'
        })
          .then(res => assert.fail(res))
          .catch(err => {
            h.assertStatus(err, 400);
            assert.equal(err.error.status, 'ERROR', 'response.status should be ERROR but got: ' + err.error.status);
            assert.equal(err.error.message, 'Unexpected token " in JSON at position 0', 'response.message got: ' + err.error.message);
          });
      });

      it('should reject large payloads', () => {
        let largeMessage = new Array(1000001).join('a');
        let largeLog = {
          uuid: this.reg.uuid,
          log: {
            version: 1,
            timestamp: 1522840762769,
            name: 'io.jenkins.plugins.SomeTypicalClass',
            level: 'WARNING',
            message: largeMessage,
            exception: {
              raw: 'serialized exception\n many \n many \n lines'
            }
          }
        };
        return request({
          url: h.getUrl('/telemetry/error'),
          method: 'POST',
          headers: { 'Authorization': this.token },
          json: true,
          body: largeLog
        })
          .then(res => assert.fail(res))
          .catch(err => {
            h.assertStatus(err, 413);
            assert.equal(err.error.status, 'ERROR', 'response.status should be ERROR but got: ' + err.error.status);
          });
      });

      it('should accept correctly formatted logs', () => {
        let emptyLog = {
          uuid: this.reg.uuid,
          log: {
            version: 1,
            timestamp: 1522840762769,
            name: 'io.jenkins.plugins.SomeTypicalClass',
            level: 'WARNING',
            message: 'the message\nand another line',
            exception: {
              raw: 'serialized exception\n many \n many \n lines'
            }
          }
        };
        return request({
          url: h.getUrl('/telemetry/error'),
          method: 'POST',
          headers: { 'Authorization': this.token },
          json: true,
          body: emptyLog
        })
          .then(res => {
            assert.ok(res);
            assert.equal(res.status, 'OK', 'response.status should be OK but got: ' + res.status);
          })
          .catch(err => assert.fail(err));
      });
    });
  });
});
