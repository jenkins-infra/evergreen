const assert  = require('assert');
const logger  = require('winston');
const request = require('request-promise');
const uuid    = require('uuid/v4');
const h       = require('../helpers');

describe('Status service acceptance tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

  it('should not allow unauthorized access', () => {
    return request({
      url: h.getUrl('/status'),
      json: true
    })
      .then(() => assert.fail('This should not have succeeded'))
      .catch((err) => h.assertStatus(err, 401));
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

      it('should allow authorized access', () => {
        return request({
          url: h.getUrl('/status'),
          headers: {
            'Authorization': this.token,
            'Content-Type': 'application/json'
          },
          json: true
        })
          .then(r => assert.ok(r))
          .catch((err) => h.assertStatus(err, 200));
      });

      describe('POST /status (create)', () => {
        it('should return a valid `channel`', async () => {
          const instanceId = uuid();
          const response = await request({
            url: h.getUrl('/status'),
            method: 'POST',
            headers: {
              'Authorization': this.token
            },
            json: true,
            body: {
              uuid: instanceId
            }
          });

          assert.ok(response);
          assert.ok(response.channelId);
        });
      });

      describe('With a valid Instance', () => {
        beforeEach(async ()  => {
          this.instanceId = uuid();
          const response = await request({
            url: h.getUrl('/status'),
            method: 'POST',
            headers: { Authorization: this.token },
            json: true,
            body: { uuid: this.instanceId }
          });
        });

        describe('GET /status/${uuid}', () => {
          beforeEach(async () => {
            this.response = await request({
              url: h.getUrl(`/status/${this.instanceId}`),
              headers: { Authorization: this.token },
              json: true
            });
          });

          it('should return the right uuid in the record', () => {
            assert.ok(this.response);
            assert.equal(this.response.uuid, this.instanceId);
          });

          it('should return the proper `channel` relationship', () => {
            assert.ok(this.response);
            assert.ok(this.response.channel);
            /* we expect everybody to be in the general channel by default */
            assert.equal(this.response.channel.name, 'general');
          });
        });
      });
    });
  });
});
