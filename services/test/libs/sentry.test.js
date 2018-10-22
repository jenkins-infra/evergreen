const Sentry = require('../../src/libs/sentry');

describe('Sentry lib', () => {
  beforeEach(() => {
    this.sentry = new Sentry();
  });

  it('does nothing with empty data', () => {
    this.sentry.sendOutput(null);
  });

  it('maps JUL levels correctly', () => {
    expect(this.sentry.mapJavaLogLevel(null)).toBe('info');
    expect(this.sentry.mapJavaLogLevel('severe')).toBe('error');
    expect(this.sentry.mapJavaLogLevel('warning')).toBe('warning');
    expect(this.sentry.mapJavaLogLevel('config')).toBe('info');
    expect(this.sentry.mapJavaLogLevel('info')).toBe('info');
    expect(this.sentry.mapJavaLogLevel('fine')).toBe('debug');
    expect(this.sentry.mapJavaLogLevel('finer')).toBe('debug');
    expect(this.sentry.mapJavaLogLevel('finest')).toBe('debug');
    expect(this.sentry.mapJavaLogLevel('foobar')).toBe('info');
  });
});
