const assert = require('assert');
const rp = require('request-promise');
const url = require('url');
const app = require('../../src/app');

const port = app.get('port') || 3030;
const getUrl = pathname => url.format({
  hostname: app.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});

const assertNotImplemented = function(response) {
  /* If there isn't a statusCode, this is likely an Error */
  if (!response.statusCode) {
    throw response;
  }
  assert.equal(response.statusCode, 405);
};

describe('Registration service acceptance tests', () => {
  before(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  after(function(done) {
    this.server.close(done);
  });

  it('should not support lookups', () => {
    return rp({
      url: getUrl('/registration/some-uuid'),
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => assertNotImplemented(res));
  });

  it('should not support updates', () => {
    return rp({
      url: getUrl('/registration/some-uuid'),
      method: 'PUT',
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => assertNotImplemented(res));
  });

  it('should not support patches', () => {
    return rp({
      url: getUrl('/registration/some-uuid'),
      method: 'PATCH',
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => assertNotImplemented(res));
  });

  it('should not support deletes', () => {
    return rp({
      url: getUrl('/registration/some-uuid'),
      method: 'DELETE',
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => assertNotImplemented(res));
  });

  it('should not support finds', () => {
    return rp({
      url: getUrl('/registration'),
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => assertNotImplemented(res));
  });
});
