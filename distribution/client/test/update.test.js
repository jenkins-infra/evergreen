const assert   = require('assert');
const tmp      = require('tmp');
const fs       = require('fs');
const feathers = require('@feathersjs/feathers');
const Update   = require('../src/lib/update');
const Storage  = require('../src/lib/storage');
const mkdirp   = require('mkdirp');


describe('The update module', () => {

  let app = null;
  let update = null;
  beforeEach( () => {
    const evergreenHome = tmp.dirSync({unsafeCleanup: true}).name;
    Storage.homeDirectory = (() => evergreenHome );
    mkdirp.sync(Storage.jenkinsHome());

    app = feathers();
    update = new Update(app);

  });

  describe('authenticate()', () => {
    it('should store the token and uuid', () => {
      let uuid = 'ohai';
      let token = 'sekret';
      update.authenticate(uuid, token);
      assert.equal(update.uuid, uuid);
      assert.equal(update.token, token);
    });
  });

  describe('getCurrentLevel()', () => {
    it('should return a natural value', () => {
      assert.ok(update.getCurrentLevel() >= 0);
    });
  });

  describe('saveUpdateSync()', () => {
    it('should write to disk', () => {
      assert(update.saveUpdateSync());
      try {
        fs.statSync(update.updatePath());
      } catch (err) {
        if (err.code == 'ENOENT') {
          assert.fail('Could not find the updates saved on disk');
        } else {
          throw err;
        }
      }
    });
  });

  describe('loadUpdateSync()', () => {
    it('when there is no data, should return null', () => {
      assert.equal(update.loadUpdateSync(), null);
    });
  });

  describe('updatePath()', () => {
    it('should return a path', () => {
      assert.equal(typeof update.updatePath(), 'string');
    });
  });

  describe('applyUpdates()', () => {
    beforeEach(() => {
      update.updateInProgress = false;
    });

    it('should not run if the instance is already updating', () => {
      update.updateInProgress = true;
      expect(update.applyUpdates()).resolves.toBeFalsy();
    });

    it('should not run if there are no updates available', () => {
      expect(update.applyUpdates()).resolves.toBeFalsy();
      expect(update.updateInProgress).toBeFalsy();
    });

    it('should not reject on no plugin updates', async () => {
      let manifest = {
        plugins: {},
      };
      let response = await update.applyUpdates(manifest);
      expect(response).toBeFalsy();
      expect(update.updateInProgress).toBeFalsy();
    });
  });
});
