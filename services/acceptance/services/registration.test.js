const assert  = require('assert');
const request = require('request-promise');
const h       = require('../helpers');

describe('Registration service acceptance tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

  describe('create()', () => {
    it('should create a UUID', async () => {
      return request({
        url: h.getUrl('/registration'),
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
        url: h.getUrl('/registration'),
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
      url: h.getUrl('/registration/some-uuid'),
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => h.assertStatus(res, 405));
  });

  it('should not support updates', () => {
    return request({
      url: h.getUrl('/registration/some-uuid'),
      method: 'PUT',
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => h.assertStatus(res, 405));
  });

  it('should not support patches', () => {
    return request({
      url: h.getUrl('/registration/some-uuid'),
      method: 'PATCH',
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => h.assertStatus(res, 405));
  });

  it('should not support deletes', () => {
    return request({
      url: h.getUrl('/registration/some-uuid'),
      method: 'DELETE',
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => h.assertStatus(res, 405));
  });

  it('should not support finds', () => {
    return request({
      url: h.getUrl('/registration'),
    })
      .then(() => assert.fail('Got a 200 response'))
      .catch(res => h.assertStatus(res, 405));
  });
});
