const assert = require('assert');
const client = require('../src/client');

describe('The base client module', () => {
  it('should interpret properly', () => {
    assert(client);
  });
});
