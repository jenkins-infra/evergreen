const assert = require('assert');
const app = require('../../src/app');

describe('\'registration\' service', () => {
  it('registered the service', () => {
    const service = app.service('registration');

    assert.ok(service, 'Registered the service');
  });

  describe('creating a registration', () => {
    it('should generate a new ECDSA keypair', async () => {
      const service = app.service('registration');
      const item = await service.create({
        ident: 'somerandomgarbage'
      });

      assert.ok(item, 'Registration created');
    });
  });
});
