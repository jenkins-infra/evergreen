const hooks  = require('../../src/services/update/update.hooks');
const errors = require('@feathersjs/errors');

const SKIP = require('@feathersjs/feathers').SKIP;

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
      const result = hooks.getHooks();
      expect(result).toHaveProperty('before');
      expect(result).toHaveProperty('after');
      expect(result).toHaveProperty('error');
    });
  });

  describe('preventRedundantCommits()', () => {
    let context = {
      app: {
        service: {}
      },
      data: {
        channel: 'general',
        commit: '0x0',
      }
    };

    it('should not skip on zero records from find()', async () => {
      context.app.service = () => {
        return {
          find: () => {
            return new Promise((resolve) => {
              resolve([]);
            });
          },
        };
      };
      const result = await hooks.preventRedundantCommits(context);
      expect(result).not.toBe(SKIP);
    });

    it('skip on records from the find()', async () => {
      context.app.service = () => {
        return {
          find: () => {
            return new Promise((resolve) => {
              resolve([1, 2]);
            });
          },
        };
      };
      await hooks.preventRedundantCommits(context);
      expect(context.statusCode).toEqual(304);
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

  describe('patchByCommitAndChannel', () => {
    let find = jest.fn();
    let context = {
      data: {},
      app: {
        service: () => {
          return {
            find: find,
          };
        },
      },
    };

    it('should look up based on commit and channel', () => {
      find.mockResolvedValue(context);
      expect(hooks.patchByCommitAndChannel(context)).resolves.toBe(context);
      expect(find).toHaveBeenCalled();
    });

    it('should throw an error to the caller if there are more than one records', async () => {
      find.mockResolvedValue([1, 2, 3]);
      await expect(hooks.patchByCommitAndChannel(context)).rejects.toThrow(errors.GeneralError);
      expect(find).toHaveBeenCalled();
      expect.assertions(2);
    });

    it('should assign the discovered id if it has been found', async () => {
      find.mockResolvedValue([
        {
          id: 1337,
        }
      ]);
      await expect(hooks.patchByCommitAndChannel(context)).resolves.toBe(context);
      expect(find).toHaveBeenCalled();
      expect(context.data.id).toEqual(1337);
      expect.assertions(3);
    });
  });
});
