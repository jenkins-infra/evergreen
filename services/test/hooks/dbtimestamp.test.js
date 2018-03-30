const assert = require('assert');
const feathers = require('@feathersjs/feathers');
const dbtimestamp = require('../../src/hooks/dbtimestamp');

describe('\'dbtimestamp\' hook', () => {
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
      before: {
        create: dbtimestamp('createdAt')
      }
    });
  });

  it('does not run the hook on get()', async () => {
    const result = await app.service('dummy').get('test');

    assert.deepEqual(result, { id: 'test' });
  });

  it('runs the hook on create', async () => {
    const result = await app.service('dummy').create({ id: 'test' });

    assert.ok(result.createdAt, 'Should have a createdAt timestamp');
  });
});
