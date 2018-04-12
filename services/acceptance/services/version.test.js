const assert  = require('assert');
const request = require('request-promise');
const h       = require('../helpers');

describe('Versions service acceptance tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

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

      let version = {
        core: 'some core version',
        checksum: '12309123079q07',
        manifest: {},
        manifestSchemaVersion: 1
      };
      it('should allow creating a versions record', () => {
        return request({
          url: h.getUrl('/versions'),
          method: 'POST',
          headers: { 'Authorization': this.token },
          json: true,
          body: Object.assign({ uuid: this.reg.uuid }, version)
        })
          .then(res => assert.ok(res))
          .catch(err => assert.fail(err));
      });

      it('should not allow creating a versions record for some other uuid', () => {
        return request({
          url: h.getUrl('/versions'),
          method: 'POST',
          headers: { 'Authorization': this.token },
          json: true,
          body: Object.assign({ uuid: 'phony' }, version)
        })
          .then(res => assert.fail('Should have failed'))
          .catch(err => h.assertStatus(err, 401));
      });
    });
  });
});
