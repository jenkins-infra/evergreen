const hooks  = require('../../src/services/update/update.hooks');
const errors = require('@feathersjs/errors');

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

  describe('checkUpdateFormat()', () => {
    it('should throw a BadRequest if there is no data', () => {
      expect(() => {
        hooks.checkUpdateFormat({});
      }).toThrow(errors.BadRequest);
    });

    it('should throw a BadRequest if the data is empty', () => {
      expect(() => {
        hooks.checkUpdateFormat({
          data: {},
        });
      }).toThrow(errors.BadRequest);
    });

    it('should throw a BadRequest if the commit field is missing or empty', () => {
      expect(() => {
        hooks.checkUpdateFormat({
          data: {
            commit: '',
          }
        });
      }).toThrow(errors.BadRequest);
    });
  });
});
