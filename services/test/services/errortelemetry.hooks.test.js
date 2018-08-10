const errors         = require('@feathersjs/errors');

const checkLogFormat = require('../../src/services/errorTelemetry/errorTelemetry.hooks').checkLogFormat;

describe('Error Telemetry Hooks', () => {
  it('should fail with empty parameters', () => {
    expect(() => {
      checkLogFormat();
    }).toThrow(/No hook at all/);
  });

  it('missing data should be rejected', async() => {
    expect(() => {
      checkLogFormat({});
    }).toThrow(/Missing data/);
  });

  it('missing log field should be rejected', async() => {
    expect(() => {
      checkLogFormat({data: {}});
    }).toThrow(/Missing log field/);
  });

  it('missing fields should be rejected', async () => {
    const badQueries = [
      {data: {'log':{}}},
      {data: {'log':{'version': 1 }}},
      {data: {'log':{'version': 1, 'timestamp': 1526387942 }}},
      {data: {'log':{'version': 1, 'timestamp': 1526387942 }}},
      {data: {'log':{'version': 1, 'timestamp': 1526387942 }, 'name': 'name'}},
      {data: {'log':{'version': 1, 'timestamp': 1526387942 }, 'name': 'name', 'level': 'info'}},
    ];
    for (let i = 0; i < badQueries.length; i++) {
      expect(() => {
        checkLogFormat(badQueries[i]);
      }).toThrow(/Missing required field/);
    }
  });

  it('should pass with valid data', async() => {
    let hook = { data : {'log':{'timestamp': 1526387942, 'version': 1, 'name': 'name', 'level': 'info', 'message': 'message' }} };
    expect(() => {
      checkLogFormat(hook);
    }).not.toThrow(errors.BadRequest);
  });
});
