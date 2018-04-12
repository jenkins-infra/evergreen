const assert   = require('assert');
const feathers = require('@feathersjs/feathers');
const Status   = require('../lib/status');

describe('The status module', () => {
  let app = feathers();
  it('should be constructable', () => {
    const s = new Status(app);
    assert.ok(s);
  });

  describe('getTimezone()', () => {
    it('should return the client timezone', () => {
      let s = new Status(app);
      assert.equal(typeof s.getTimezone(), 'string');
    });
  });
});
