const assert = require('assert');
const app = require('../../src/app');

describe('\'pusher\' service', () => {
  it('registered the service', () => {
    const service = app.service('errorTelemetry');

    assert.ok(service, 'Registered the service');
  });
});

describe('error logging', () => {
  it('should fail with empty parameters', () => {
    const service = app.service('errorTelemetry');
    return service.create()
      .then(() => assert.fail('Should have failed to create()'))
      .catch((err) => assert.ok(err.message.match('^A data object must be provided')));
  });

  it('should create a log', async () => {
    const service = app.service('errorTelemetry');
    const errorLog = await service.create({
      log: '{"blah":true}'
    });

    assert.ok(errorLog.log, 'A log should have been stored');
    assert.equal(errorLog.log, '{"blah":true}', 'The log should have been stored');
    assert.ok(errorLog.createdAt, 'Expected a timestamp to be generated on call');
  });

});
