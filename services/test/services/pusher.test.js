const assert = require('assert');
const app = require('../../src/app');

describe('\'pusher\' service', () => {
  it('registered the service', () => {
    const service = app.service('pusher');

    assert.ok(service, 'Registered the service');
  });
});
