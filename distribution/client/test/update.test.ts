const fs            = require('fs');
const feathers      = require('@feathersjs/feathers');
const mkdirp        = require('mkdirp');

import tmp from 'tmp';
import h from '../testlib/helpers';

import Update from '../src/lib/update';
import HealthChecker from '../src/lib/healthchecker';
import Storage from '../src/lib/storage';
import Supervisord from '../src/lib/supervisord';
import Downloader from '../src/lib/downloader';

describe('The update module', () => {
  let app = null;
  let update = null;
  let restartCalled = false;

  beforeEach( () => {
    const evergreenHome = tmp.dirSync({unsafeCleanup: true}).name;
    process.env.EVERGREEN_DATA = evergreenHome;
    Storage.homeDirectory = (() => evergreenHome );
    mkdirp.sync(Storage.jenkinsHome());

    app = feathers();
    update = new Update(app);
    update.healthChecker = new HealthChecker('http://127.0.0.1:8080/', { delay: 50, retry: 5});
    update.healthChecker.check = () => {
      return Promise.resolve({ healthy:true, message: 'fake'});
    };
    restartCalled = false;
    update.restartJenkins = () => {
      restartCalled = true;
      return Promise.resolve(true);
    };
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
      expect(update.saveUpdateSync({})).toBeTruthy();
      expect(() => {
        fs.statSync(update.updatePath());
      }).not.toThrow();
    });
  });
  describe('recordUpdateLevel()', () => {
    it('should not fail', () => {
      expect(update.recordUpdateLevel()).toBeTruthy();
      expect(() => {
        fs.statSync(update.auditLogPath());
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
    let manifest : any = {};
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
      expect(response).toBe(true);

      expect(update.updateInProgress).toBeFalsy();
    });

    it('should still update core if nothing else is passed in', async () => {
      // Fake core with something much smaller, just to get a remote file (extension-filter is ~16kB)
      manifest.core = {
        url: 'https://updates.jenkins-ci.org/download/plugins/extension-filter/1.0/extension-filter.hpi',
        checksum: { signature: '9f82f97ad3f7625c03e15fbb7fc213eff23cc37535548383897670e0d6c7cf26' }
      };
      const response = await update.applyUpdates(manifest);
      expect(response).toBeTruthy();
      expect(h.checkFileExists(`${Storage.jenkinsHome()}/jenkins.war`)).toBeTruthy();
      expect(update.updateInProgress).toBeFalsy();
    });

    it('should execute deletes if passed in with no updates', async () => {
      const pluginPath = Storage.pluginsDirectory();

      manifest.plugins.deletes = ['delete1', 'delete2'];
      mkdirp.sync(pluginPath);

      manifest.plugins.deletes.forEach((filename) => {
        h.touchFile(`${pluginPath}/${filename}.hpi`);
        expect(h.checkFileExists(`${pluginPath}/${filename}.hpi`)).toBeTruthy();
      });

      const response = await update.applyUpdates(manifest);
      expect(response).toBeTruthy();
      expect(update.updateInProgress).toBeFalsy();

      manifest.plugins.deletes.forEach((filename) => {
        expect(h.checkFileExists(`${pluginPath}/${filename}.hpi`)).toBeFalsy();
      });
      expect(restartCalled).toBeTruthy();
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
      expect(h.checkFileExists(`${pluginPath}`)).toBeTruthy();
      expect(h.checkFileExists(`${pluginPath}/daily-quote.hpi`)).toBeTruthy();
      expect(restartCalled).toBeTruthy();
    });

    it('should execute both updates and deletes if both passed in', async () => {
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
        expect(h.checkFileExists(`${pluginPath}/${filename}.hpi`)).toBeTruthy();
      });
      let response = await update.applyUpdates(manifest);
      expect(response).toBeTruthy();
      expect(update.updateInProgress).toBeFalsy();
      expect(h.checkFileExists(`${pluginPath}/daily-quote.hpi`)).toBeTruthy();
      manifest.plugins.deletes.forEach((filename) => {
        expect(h.checkFileExists(`${pluginPath}/${filename}.hpi`)).toBeFalsy();
      });
    });
  });
});
