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

  describe('GET /update', () => {
    it('should return 400 when called without anything', () => {
      return request({
        url: h.getUrl('/update'),
        headers: { 'Authorization': this.token },
        json: true
      })
        .then(r => expect(r))
        .catch((err) => h.assertStatus(err, 400));
    });
  });
});
