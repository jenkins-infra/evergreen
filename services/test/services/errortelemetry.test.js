const assert = require('assert');
const app = require('../../src/app');

const errorTelemetryService = 'telemetry/error';

describe('\'ErrorTelemetry\' service', () => {
  it('registered the service', () => {
    const service = app.service(errorTelemetryService);

    assert.ok(service, 'Registered the service');
  });
});

describe('Error Telemetry', () => {
  it('should fail with empty parameters', () => {
    const service = app.service(errorTelemetryService);
    return service.create()
      .then(() => assert.fail('Should have failed to create()'))
      .catch((err) => assert.ok(err.message.match('^A data object must be provided')));
  });

  it('should create a log', async () => {
    const service = app.service(errorTelemetryService);
    const errorLog = await service.create({
      log: '{"blah":true}'
    });

    assert.ok(errorLog.log, 'A log should have been stored');
    assert.equal(errorLog.log, '{"blah":true}', 'The log should have been stored');
    assert.ok(errorLog.createdAt, 'Expected a timestamp to be generated on call');
  });

});
