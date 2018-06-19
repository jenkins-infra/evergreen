/*
 * This suite of acceptance tests corresponds to JEP-307 and ensures that the
 * Update service is behaving as expected
 */

const fs   = require('fs');

const request = require('request-promise');
const h       = require('../helpers');

describe('Update service acceptance tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

  beforeEach(async () => {
    let { token, uuid } = await h.registerAndAuthenticate();
    this.token = token;
    this.uuid = uuid;
  });

  describe('PUT /update', () => {
    beforeEach(() => {
      this.ingest = JSON.parse(fs.readFileSync('./ingest.json'));
      this.settings = JSON.parse(fs.readFileSync(`./config/${process.env.NODE_ENV}.json`));
    });

    it('should treat an empty `create` as invalid', () => {
      return request({
        url: h.getUrl('/update'),
        method: 'POST',
        json: true,
        headers: { 'Authorization': this.settings.internalAPI.secret },
        body: {}
      })
        .then(r => expect(r))
        .catch((err) => h.assertStatus(err, 400));
    });

    it('should treat a valid "ingest JSON" as valid', () => {
      return request({
        url: h.getUrl('/update'),
        method: 'POST',
        headers: { 'Authorization': this.settings.internalAPI.secret },
        json: true,
        body: {
          commit: '0xdeadbeef',
          manifest: this.ingest,
        },
      })
        .then(r => expect(r.id).toBeGreaterThan(0))
        .catch((err) => h.assertStatus(err, 200));
    });
  });
});
