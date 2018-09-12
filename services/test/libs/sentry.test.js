const Sentry = require('../../src/libs/sentry');

describe('Sentry lib', () => {
  beforeEach(() => {
    this.sentry = new Sentry();
  });

  it('does nothing with empty data', () => {
    this.sentry.sendOutput(null);
  });
});
