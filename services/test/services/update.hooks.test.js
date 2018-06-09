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
});
