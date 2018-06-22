const hooks = require('../src/app.hooks');

describe('global application hooks', () => {
  it('should have before/after/error properties', () => {
    expect(hooks).toHaveProperty('before');
    expect(hooks).toHaveProperty('after');
    expect(hooks).toHaveProperty('error');
  });
});
