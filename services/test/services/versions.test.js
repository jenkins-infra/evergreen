const assert = require('assert');
const app = require('../../src/app');

describe('\'versions\' service', () => {
  it('registered the service', () => {
    const service = app.service('versions');

    assert.ok(service, 'Registered the service');
  });
});
