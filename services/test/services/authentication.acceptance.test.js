const assert = require('assert');
const rp     = require('request-promise');
const url    = require('url');
const app    = require('../../src/app');

const port = app.get('port') || 3030;
const getUrl = pathname => url.format({
  hostname: app.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});

const assertStatus = function(response, code) {
  if (response.statusCode) {
    assert.equal(response.statusCode, code);
  }
  else {
    throw response;
  }
};

describe('Authentication service acceptance tests', () => {
  beforeAll(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  afterAll(function(done) {
    this.server.close(done);
  });

  describe('create()', () => {
    it('should return a 400 for a malformed request', () => {
      return rp({
        url: getUrl('/authentication'),
        method: 'POST'
      })
        .then(() => assert.fail('Got a 200 response'))
        .catch(res => assertStatus(res, 400));
    });

    it('should return a 404 if the client has not registered', () => {
      return rp({
        url: getUrl('/authentication'),
        method: 'POST',
        json: true,
        body: {
          uuid: 'non-existent',
          signature: 'malarkey'
        }
      })
        .then(() => assert.fail('Got a 200 response'))
        .catch(res => assertStatus(res, 404));
    });
  });
});
