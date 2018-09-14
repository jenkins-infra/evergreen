const request  = require('request-promise');
const h        = require('../helpers');

describe('Tainted service acceptance tests', () => {
  beforeAll((done) => h.startApp(done));
  afterAll(done => h.stopApp(done));

  beforeEach(async () => {
    let { token, uuid } = await h.registerAndAuthenticate();
    this.token = token;
    this.uuid = uuid;
  });

  describe('POST /update/tainted', () => {
    it('should allow marking a level', () => {
      return request({
        url: h.getUrl('/update/tainted'),
        method: 'POST',
        json: true,
        resolveWithFullResponse: true,
        headers: { 'Authorization': this.token },
        body: {
          uuid: this.uuid,
          level: 1,
        },
      })
        .then(res => expect(res.statusCode).toEqual(201))
        .catch(err => expect(err).toBeFalsy());
    });
  });
});
