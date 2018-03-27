const assert = require('assert');
const mocha  = require('mocha');

const reg    = require('../lib/registration');


describe('The registration module', () => {
  describe('hasKeys()', () => {
    it('should return false by default', () => {
      assert.equal(false, reg.hasKeys());
    });
  });

  describe('generateKeys()', () => {
  });
});
