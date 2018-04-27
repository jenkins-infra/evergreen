const assert   = require('assert');
const hooks    = require('../../src/services/versions/versions.hooks');

describe('versions service hooks', () => {
  describe('computeManifestChecksum()', () => {
    let context = {
      data: {
        uuid: 'some-uuid',
        manifest: {
          first: 'alpha',
          second: 'bravo',
          third: 'charlie',
        }
      }
    };

    it('should return a hash based off the manifest', () => {
      hooks.computeManifestChecksum(context);
      assert.equal(typeof context.data.checksum, 'string');
    });

    it('should return consistent hashes', () => {
      let second = JSON.parse(JSON.stringify(context));
      hooks.computeManifestChecksum(context);
      hooks.computeManifestChecksum(second);
      assert.equal(context.data.checksum,
        second.data.checksum);
    });
  });
});
