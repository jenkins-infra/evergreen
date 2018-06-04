const hooks  = require('../../src/services/update/update.hooks');

describe('update service hooks', () => {
  describe('scopeFindQuery()', () => {
    let context = {
      params: {},
    };

    it('should default the channel', () => {
      hooks.scopeFindQuery(context);
      expect(context.params.query.channel).toBe('general');
    });

    it('should sort by most recent when there is no pre-defined level', () => {
      hooks.scopeFindQuery(context);
      expect(context.params.query.$sort.createdAt).toBe(-1);
    });

    it('should use the channel provided by the request', () => {
      context.params.query = { channel: 'beta' };
      hooks.scopeFindQuery(context);
      expect(context.params.query.channel).toBe('beta');
    });

    it('should use the request-provided level and sort from there', () => {
      context.params.query = { level: 5 };
      hooks.scopeFindQuery(context);

      let query = context.params.query;
      expect(query.$sort.createdAt).toBe(1);
      expect(query.id.$gt).toBe(5);
    });
  });

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
