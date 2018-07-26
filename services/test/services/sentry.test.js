const sentry = require('../../src/libs/sentry');

describe('Sentry lib', () => {
  it('does nothing with empty data', () => {
    sentry.sendOutput(null);
  });
});
