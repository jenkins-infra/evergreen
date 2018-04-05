const assert  = require('assert');
const request = require('request-promise');
const h       = require('../helpers');

describe('Status service acceptance tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

  describe('creating a Status', () => {
    it('should not allow unauthorized access', () => {
      return request({
        url: h.getUrl('/status'),
        json: true
      })
        .then(() => assert.fail('This should not have succeeded'))
        .catch((err) => h.assertStatus(err, 401));
    });
  });
});
