const assert = require('assert');
const app = require('../../src/app');

describe('\'update\' service', () => {
  it('registered the service', () => {
    const service = app.service('update');

    assert.ok(service, 'Registered the service');
  });
});
