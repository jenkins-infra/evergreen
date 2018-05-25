const assert         = require('assert');
const errors         = require('@feathersjs/errors');

const checkLogFormat = require('../../src/services/errorTelemetry/errorTelemetry.hooks').checkLogFormat;

describe('Error Telemetry Hooks', () => {
  it('should fail with empty parameters', () => {
    try {
      checkLogFormat();
    } catch (err) {
      assert.ok( err instanceof errors.BadRequest );
    }
  });

  it('missing fields should be rejected', async () => {
    const badQueries = [
      {},
      {'log':{'version': 1 }},
      {'log':{'timestamp': 1526387942 }}
    ];
    for ( let i=0; i<badQueries.length;i++ ) {
      try {
        checkLogFormat(badQueries[i]);
        assert.fail('Should have failed above (value=${badQueries[i]})');
      } catch (err) {
        assert.ok( err instanceof errors.BadRequest );
      }
    }
  });
});
