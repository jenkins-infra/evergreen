const assert   = require('assert');
const feathers = require('@feathersjs/feathers');
const errors   = require('@feathersjs/errors');
const hooks    = require('../../src/services/status/status.hooks');
const validateRequiredFields = require('../../src/services/status/status.hooks').validateRequiredFields;

describe('status service hooks', () => {
  it('should pass with required fields', () => {
    const goodQuery = {
      data: {
        'flavor':'value',
      },
    };
    expect(() => {
      validateRequiredFields(goodQuery);
    }).not.toThrow(errors.BadRequest);
  });

  describe('rejection of missing fields', () => {
    let context = { data: {} };

    it('should reject an empty data payload', () => {
      expect(() => {
        validateRequiredFields(context);
      }).toThrow(errors.BadRequest);
    });

    it('should reject a missing flavor', () => {
      context.data = { 'uuid' : 'value' };
      expect(() => {
        validateRequiredFields(context);
      }).toThrow(errors.BadRequest);
    });
  });

  describe('get hooks', () => {
    let app;

    beforeEach(() => {
      app = feathers();

      app.use('/dummy', {
        async get(id) {
          return { id };
        },
        async create(id) {
          return id;
        }
      });

      app.service('dummy').hooks({
        before: []
      });
    });

    let context = { data: {}, params: {} };
    let updateModel = new Object();

    beforeEach(() => {
      context.app = app;
      app.set('models', { update: updateModel });
    });

    it('should include the Instance model associations', () => {
      assert.equal(context, hooks.includeAssociations(context));
      assert.ok(context.params.sequelize, 'context.params.sequelize is supposed to exist now');
      let includes = context.params.sequelize.include;
      assert.ok(includes);
      assert.equal(includes[0], updateModel);
    });

    it('should prune user-supplied query parameters', () => {
      context.params.query = { include: 'hi' };
      assert.equal(context, hooks.pruneQueryParams(context));
      assert.equal(context.params.query.include, undefined);
    });

    describe('defaultUpdateLevel()', () => {
      let context = {
        app: {},
        data : {},
      };

      it('should throw an error when no updates can be found', () => {
        /*
         * Mock up an update.find() empty response
         */
        context.app.service = () => {
          return {
            find: () => {
              return {};
            },
          };
        };

        /*
         * Testing error conditions on async methods is a little tricky, and if
         * the function returns cleanly, rejects.toThrow won't fail properly.
         * Adding the expect.assertions() ensures that we fail if our toThrow
         * assertion doesn't run
         */
        expect.assertions(1);
        expect(hooks.defaultUpdateLevel(context)).rejects.toThrow(Error);
      });
    });
  });
});
