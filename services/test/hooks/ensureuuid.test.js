const assert             = require('assert');
const errors             = require('@feathersjs/errors');
const ensureMatchingUUID = require('../../src/hooks/ensureuuid');

describe('ensureuuid hook', () => {
  let context = { data: {} };

  it('should fail if the request does not include a UUID', () => {
    try {
      assert.fail(ensureMatchingUUID(context));
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
      assert.fail(ensureMatchingUUID(context));
    }
    catch (err) {
      assert.equal(err.name, errors.NotAuthenticated.name);
    }
  });
});
