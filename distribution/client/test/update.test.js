jest.mock('../src/lib/supervisord');

const assert   = require('assert');
const tmp      = require('tmp');
const fs       = require('fs');
const feathers = require('@feathersjs/feathers');
const h        = require('./helpers');
const Update   = require('../src/lib/update');
const HealthChecker = require('../src/lib/healthchecker');
const Storage  = require('../src/lib/storage');
const Supervisord = require('../src/lib/supervisord');
const mkdirp   = require('mkdirp');


describe('The update module', () => {

  let app = null;
  let update = null;
  beforeEach( () => {
    const evergreenHome = tmp.dirSync({unsafeCleanup: true}).name;
    process.env.EVERGREEN_HOME = evergreenHome;
    Storage.homeDirectory = (() => evergreenHome );
    mkdirp.sync(Storage.jenkinsHome());

    app = feathers();
    update = new Update(app);
    update.healthChecker = new HealthChecker('http://127.0.0.1:8080/', { delay: 50, retry: 5});

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
    let manifest = null;
    beforeEach(() => {
      update.updateInProgress = false;
      manifest = {
        meta: { level: 0 },
        plugins: {},
      };
    });

    it('should not run if the instance is already updating', () => {
      update.updateInProgress = true;
      expect(update.applyUpdates(manifest)).resolves.toBeFalsy();
    });

    it('should not run if there are no updates available', () => {
      expect(update.applyUpdates()).resolves.toBeFalsy();
      expect(update.updateInProgress).toBeFalsy();
    });

    it('should not reject on no plugin updates', async () => {
      let response = await update.applyUpdates(manifest);
      expect(response).toBeFalsy();
      expect(update.updateInProgress).toBeFalsy();
    });

    it('should execute deletes if passed in with no updates', async () => {
      manifest.plugins.deletes = ['delete1', 'delete2'];
      const pluginPath = Storage.pluginsDirectory();
      mkdirp.sync(pluginPath);
      manifest.plugins.deletes.forEach((filename) => {
        h.touchFile(`${pluginPath}/${filename}.hpi`);
        expect(h.checkFileExists(`${pluginPath}/${filename}.hpi`)).resolves.toBeTruthy();
      });
      let response = await update.applyUpdates(manifest);
      expect(response).toBeTruthy();
      expect(update.updateInProgress).toBeFalsy();
      manifest.plugins.deletes.forEach((filename) => {
        expect(h.checkFileExists(`${pluginPath}/${filename}.hpi`)).resolves.toBeFalsy();
      });
      expect(Supervisord.restartProcess).toHaveBeenCalled();
    });

    it ('should execute updates if passed in with no deletes', async () => {

      jest.setTimeout(10000);

      // daily-quote is only about 7k, good for simple download test
      manifest.plugins.updates = [
        {
          artifactId: 'daily-quote',
          url: 'http://updates.jenkins-ci.org/download/plugins/daily-quote/1.0/daily-quote.hpi',
          checksum: { signature: 'e0e6bf16f76f1627c1aa296d796c6cc55cdcca838ae5d144f698524b488a72c1' }
        }
      ];
      const pluginPath = Storage.pluginsDirectory();
      mkdirp.sync(pluginPath);
      let response = await update.applyUpdates(manifest);
      expect(response).toBeTruthy();
      expect(update.updateInProgress).toBeFalsy();
      expect(h.checkFileExists(`${pluginPath}/daily-quote.hpi`)).resolves.toBeTruthy();
      expect(Supervisord.restartProcess).toHaveBeenCalled();
    });
  });
});
