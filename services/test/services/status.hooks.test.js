const assert   = require('assert');
const feathers = require('@feathersjs/feathers');
const errors   = require('@feathersjs/errors');
const hooks    = require('../../src/services/status/status.hooks');

describe('status service hooks', () => {
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
      before: [
      ]
    });
  });

  describe('create hooks', () => {
    let context = { data: {} };

    it('should set the default channel', () => {
      assert.equal(context, hooks.defaultChannel(context));
      /* we're assuming the channelId of three, which is hard-coded in our
       * seeds, will be the 'general' channelId
       */
      assert.equal(context.data.channelId, 3);
    });

    it('should fail if the request does not include a UUID', () => {
      context = { data: { } };
      try {
        assert.fail(hooks.ensureMatchUUID(context));
      }
      catch (err) {
        assert.equal(err.name, errors.BadRequest.name);
      }
    });

    it('should fail if the JWT uuid and the given UUID are identical', () => {
      context = {
        data: {
          uuid: 'who I want to be'
        },
        params: {
          payload: {
            uuid: 'who i am allowed to be',
          }
        }
      };

      try {
        assert.fail(hooks.ensureMatchUUID(context));
      }
      catch (err) {
        assert.equal(err.name, errors.NotAuthenticated.name);
      }
    });
  });

  describe('get hooks', () => {
    let context = { data: {}, params: {} };
    let channelModel = new Object();

    beforeEach(() => {
      context.app = app;
      app.set('models', { channel: channelModel });
    });

    it('should include the Instance model associations', () => {
      assert.equal(context, hooks.includeAssociations(context));
      assert.ok(context.params.sequelize, 'context.params.sequelize is supposed to exist now');
      let includes = context.params.sequelize.include;
      assert.ok(includes);
      assert.equal(includes[0], channelModel);
    });

    it('should prune user-supplied query parameters', () => {
      context.params.query = { include: 'hi' };
      assert.equal(context, hooks.pruneQueryParams(context));
      assert.equal(context.params.query.include, undefined);
    });
  });
});
