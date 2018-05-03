const assert = require('assert');
const client = require('../src/client');

describe('The base client module', () => {
  it('should interpret properly', () => {
    assert(client);
  });

  it('should remove trailing slash', () => {
    assert.equal('blah', new client().removeTrailingSlashes('blah'));
    assert.equal('blah', new client().removeTrailingSlashes('blah/'));
    assert.equal('blah', new client().removeTrailingSlashes('blah//'));
    assert.equal('', new client().removeTrailingSlashes('//'));
  });

});
