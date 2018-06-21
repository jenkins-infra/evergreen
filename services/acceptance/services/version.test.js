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

      /*
       * See
       * https://github.com/jenkinsci/jep/tree/master/jep/307#version-manifest
       */
      let manifest = {
        schema: 1,
        container: {
          commit: '0602843',
          tools: {
            node: '',
            npm: '',
            java: ''
          },
        },
        client: {
          version: '1.0.0'
        },
        jenkins: {
          core: {
            version: '2.107.3-evergreen-spec'
          },
          plugins: {
            'git-client': '2.7.1',
          }
        }
      };

      it('should allow creating a versions record', () => {
        let version = {
          uuid: this.reg.uuid,
          manifest: manifest,
        };
        return request({
          url: h.getUrl('/versions'),
          method: 'POST',
          headers: { 'Authorization': this.token },
          json: true,
          body: version
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
          body: { uuid: 'phony', manifest: manifest }
        })
          .then(() => assert.fail('Should have failed'))
          .catch(err => h.assertStatus(err, 401));
      });

      it('should disallow creating redundant versions records', async () => {
        let req = {
          url: h.getUrl('/versions'),
          method: 'POST',
          headers: { 'Authorization': this.token },
          json: true,
          body: { uuid: this.reg.uuid, manifest: manifest }
        };
        await request(req);

        try {
          await request(req);
          assert.fail('Should not have succeeded');
        } catch (err) {
          h.assertStatus(err, 400);
        }
      });
    });
  });
});
