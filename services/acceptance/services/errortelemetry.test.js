const assert  = require('assert');
const request = require('request-promise');
const h       = require('../helpers');

describe('Error Telemetry service acceptance tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

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
