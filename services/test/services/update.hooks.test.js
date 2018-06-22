const hooks  = require('../../src/services/update/update.hooks');

describe('update service hooks', () => {
  describe('defaultChannel()', () => {
    let context = {
      params: {},
      data: {},
    };

    it('should add the default `channel` to the context.data', () => {
      expect(hooks.defaultChannel(context)).toBe(context);
      expect(context.data.channel).toBe('general');
    });
  });

  describe('getHooks()', () => {
    it('should have before/after/error properties', () => {
      let result = hooks.getHooks();
      expect(result).toHaveProperty('before');
      expect(result).toHaveProperty('after');
      expect(result).toHaveProperty('error');
    });
  });
});
