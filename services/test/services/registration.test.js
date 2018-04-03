/* eslint-disable no-unused-vars */

const assert = require('assert');
const logger = require('winston');
const app    = require('../../src/app');

describe('\'registration\' service', () => {
  it('registered the service', () => {
    const service = app.service('registration');

    assert.ok(service, 'Registered the service');
  });

  describe('registration of an instance', () => {
    it('should fail with empty parameters', () => {
      const service = app.service('registration');
      return service.create()
        .then(() => assert.fail('Should have failed to create()'))
        .catch((err) => assert.ok(err.message.match('^A data object must be provided')));
    });

    it('should fail without a curve', () => {
      const service = app.service('registration');
      return service.create({
        pubKey: 'ImagineThisIsAnECDHPublicKeyHex'
      })
        .then()
        .catch((err) =>  assert.ok(err.message.match('^Client must provide a curve')));
    });

    it('should return a uuid for successful registration', async () => {
      const service = app.service('registration');
      const reg = await service.create({
        pubKey: 'ImagineThisIsAnECDHPublicKeyHex'
      });

      assert.ok(reg.uuid, 'Expected a uuid to be generated on registration');
    });

    it('should persist a uuid and pubKey on registration', async () => {
      const service = app.service('registration');
      const reg = await service.create({
        pubKey: 'ImagineThisIsAnECDHPublicKeyHex'
      });

      assert.ok(reg);
      assert.ok(reg.createdAt);
    });
  });

  describe('looking up a registration', () => {
    beforeEach(async () => {
      this.reg = await app.service('registration').create({
        pubKey: 'a-hex-key'
      });
    });

    it('should be able to look up by uuid', async () => {
      assert.ok(this.reg.uuid, 'Setup did not create the registration properly');
      const service = app.service('registration');

      const rows = await service.find({ query: { uuid: this.reg.uuid }});
      assert.equal(rows.total, 1, 'Should only have one record per uuid');
      assert.equal(rows.data[0].uuid, this.reg.uuid);
    });
  });
});
