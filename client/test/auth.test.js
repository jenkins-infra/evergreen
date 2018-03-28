const assert = require('assert');
const auth   = require('../lib/auth');

describe('The auth module', () => {
  describe('getToken()', () => {
    it('should have no defined default value', () => {
      assert.equal(auth.getToken(), undefined);
    });
  });
});
