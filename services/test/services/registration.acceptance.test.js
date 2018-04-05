const assert  = require('assert');
const request = require('request-promise');
const url     = require('url');
const app     = require('../../src/app');

const port = app.get('port') || 3030;
const getUrl = pathname => url.format({
  hostname: app.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});

const assertStatus = function(response, code) {
  /* If there isn't a statusCode, this is likely an Error */
  if (!response.statusCode) {
    throw response;
  }
  assert.equal(response.statusCode, code);
};

describe('Registration service acceptance tests', () => {
  beforeAll(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  afterAll(function(done) {
    this.server.close(done);
  });

  describe('create()', () => {
    it('should create a UUID', async () => {
      return request({
        url: getUrl('/registration'),
        method: 'POST',
        json: true,
        body: {
          pubKey: 'pretend-pubkey',
          curve: 'secp256k1'
        }
      })
        .then(res => assert.ok(res.uuid, 'Missing a uuid'))
        .catch(res => assert.equal(res.statusCode, 201));
    });

    it('should fail when there is no curve', async () => {
      return request({
        url: getUrl('/registration'),
        method: 'POST',
        json: true,
        body: {
          pubKey: 'pretend-pubkey'
        }
      })
        .then(() => assert.fail('Should have failed'))
        .catch(res => assert.equal(res.statusCode, 400));
    });
  });

  it('should not support lookups', () => {
    return request({
      url: getUrl('/registration/some-uuid'),
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => assertStatus(res, 405));
  });

  it('should not support updates', () => {
    return request({
      url: getUrl('/registration/some-uuid'),
      method: 'PUT',
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => assertStatus(res, 405));
  });

  it('should not support patches', () => {
    return request({
      url: getUrl('/registration/some-uuid'),
      method: 'PATCH',
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => assertStatus(res, 405));
  });

  it('should not support deletes', () => {
    return request({
      url: getUrl('/registration/some-uuid'),
      method: 'DELETE',
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => assertStatus(res, 405));
  });

  it('should not support finds', () => {
    return request({
      url: getUrl('/registration'),
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => assertStatus(res, 405));
  });
});
