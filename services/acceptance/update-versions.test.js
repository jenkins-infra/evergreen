/*
 * This test suite covers the interactions between the `versions` and the
 * `update` service for generating the appropriate update manifest for a
 * client.
 */

const request = require('request-promise');
const h       = require('./helpers');

describe('versions/updates interaction acceptance tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

  beforeEach(async () => {
    let { token, uuid } = await h.registerAndAuthenticate();
    this.token = token;
    this.uuid = uuid;
  });

  describe('fetching updates for a fresh client', () => {
    beforeEach(async () => {
      this.response = await request({
        url: h.getUrl(`/update/${this.uuid}`),
        qs: {
          level: 1,
        },
        headers: { 'Authorization': this.token },
        json: true
      });
    });

    it('should be in the `general` channel', () => {
      expect(this.response).toHaveProperty('meta.channel', 'general');
    });

    it('should have a core url', () => {
      expect(this.response).toHaveProperty('core.url');
    });
  });
});
