jest.mock('../src/lib/supervisord');
jest.mock('../src/lib/downloader');

const tmp           = require('tmp');
const fs            = require('fs');
const feathers      = require('@feathersjs/feathers');
const h             = require('./helpers');
const Update        = require('../src/lib/update');
const HealthChecker = require('../src/lib/healthchecker');
const Storage       = require('../src/lib/storage');
const Supervisord   = require('../src/lib/supervisord');
const Downloader    = require('../src/lib/downloader');
const mkdirp        = require('mkdirp');

describe('The update module', () => {
  let app = null;
  let update = null;

  beforeEach( () => {
    const evergreenHome = tmp.dirSync({unsafeCleanup: true}).name;
    process.env.EVERGREEN_DATA = evergreenHome;
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
      expect(update.uuid).toEqual(uuid);
      expect(update.token).toEqual(token);
    });
  });

  describe('getCurrentLevel()', () => {
    it('should return a natural value', () => {
      expect(update.getCurrentLevel()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('saveUpdateSync()', () => {
    it('should write to disk', () => {
      expect(update.saveUpdateSync()).toBeTruthy();
      expect(() => {
        fs.statSync(update.updatePath());
      }).not.toThrow();
    });
  });

  describe('loadUpdateSync()', () => {
    it('when there is no data, should return null', () => {
      expect(update.loadUpdateSync()).toBeNull();
    });
  });

  describe('updatePath()', () => {
    it('should return a path', () => {
      expect(typeof update.updatePath()).toEqual('string');
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
      return expect(update.applyUpdates(manifest)).resolves.toBeFalsy();
    });

    it('should not run if there are no updates available', async () => {
      const rc = await update.applyUpdates();
      expect(rc).toBeFalsy();
      expect(update.updateInProgress).toBeFalsy();
    });

    it('should not reject on no plugin updates', async () => {
      const response = await update.applyUpdates(manifest);
      expect(response).toBeFalsy();
      expect(update.updateInProgress).toBeFalsy();
    });

    it('should still update core if nothing else is passed in', async () => {
      Downloader.download.mockImplementationOnce(() => true);
      manifest.core = {
        url: 'testurl',
        checksum: { signature: 'signature' }
      };
      const response = await update.applyUpdates(manifest);
      expect(response).toBeTruthy();
      expect(update.updateInProgress).toBeFalsy();
    });

    it('should execute deletes if passed in with no updates', async () => {
      const expectations = [];
      const pluginPath = Storage.pluginsDirectory();

      manifest.plugins.deletes = ['delete1', 'delete2'];
      mkdirp.sync(pluginPath);

      manifest.plugins.deletes.forEach((filename) => {
        h.touchFile(`${pluginPath}/${filename}.hpi`);
        expectations.push(
          expect(h.checkFileExists(`${pluginPath}/${filename}.hpi`)).resolves.toBeTruthy()
        );
      });

      const response = await update.applyUpdates(manifest);
      expect(response).toBeTruthy();
      expect(update.updateInProgress).toBeFalsy();

      manifest.plugins.deletes.forEach((filename) => {
        expectations.push(
          expect(h.checkFileExists(`${pluginPath}/${filename}.hpi`)).resolves.toBeFalsy()
        );
      });
      expect(Supervisord.restartProcess).toHaveBeenCalled();
      return Promise.all(expectations);
    });

    it ('should execute updates if passed in with no deletes', async () => {
      jest.setTimeout(10000);
      Downloader.download.mockImplementationOnce(() => {
        require.requireActual('../src/lib/downloader').default;
      });

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
      expect(await h.checkFileExists(`${pluginPath}/daily-quote.hpi`)).toBeTruthy();
      expect(Supervisord.restartProcess).toHaveBeenCalled();
    });

    it('should execute both updates and deletes if both passed in', async () => {
      Downloader.download.mockImplementationOnce(() => {
        require.requireActual('../src/lib/downloader').default;
      });
      manifest.plugins.deletes = ['delete1'];
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
      manifest.plugins.deletes.forEach((filename) => {
        h.touchFile(`${pluginPath}/${filename}.hpi`);
        expect(h.checkFileExists(`${pluginPath}/${filename}.hpi`)).resolves.toBeTruthy();
      });
      let response = await update.applyUpdates(manifest);
      expect(response).toBeTruthy();
      expect(update.updateInProgress).toBeFalsy();
      expect(h.checkFileExists(`${pluginPath}/daily-quote.hpi`)).resolves.toBeTruthy();
      manifest.plugins.deletes.forEach((filename) => {
        expect(h.checkFileExists(`${pluginPath}/${filename}.hpi`)).resolves.toBeFalsy();
      });
    });
  });
});
