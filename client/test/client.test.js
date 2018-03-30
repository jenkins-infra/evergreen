const assert = require('assert');
const client = require('../client');

describe('The base client module', () => {
  it('should interpret properly', () => {
    assert(client);
  });

  describe('main()', () => {
    /* since main() starts the runloop, there's no sense in starting it in a
     * test
     */
  });
});
