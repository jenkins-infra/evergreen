const assert = require('assert');
const path   = require('path');

const reg    = require('../lib/registration');


describe('The registration module', () => {
  describe('hasKeys()', () => {
    it('should return false by default', () => {
      assert.equal(false, reg.hasKeys());
    });
  });

  describe('generateKeys()', () => {
  });

  describe('publicKeyPath()', () => {
    it('should return a path', () => {
      const p = reg.publicKeyPath();
      assert(p != path.basename(p), 'This doesn\'t look like a path');
    });
  });

  describe('keyPath()', () => {
    it('should return a path', () => {
      const keys = reg.keyPath();
      assert(keys != path.basename(keys), 'This doesn\'t look like a path');
    });
  });

  it('should return a string for homeDirectory()', () => {
    let home = reg.homeDirectory();
    assert.equal(typeof home, 'string');
  });
});
