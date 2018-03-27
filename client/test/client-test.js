const assert = require('assert');
const mocha  = require('mocha');
const client = require('../client');

describe('The base client module', () => {
  it('should return a string for homeDirectory()', () => {
    let home = client.homeDirectory();
    assert.equal(typeof home, 'string');
  });

  describe('main()', () => {
    /* since main() starts the runloop, there's no sense in starting it in a
     * test
     */
  });
})
