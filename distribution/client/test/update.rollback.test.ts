jest.mock('../src/lib/supervisord');

import feathers      from '@feathersjs/feathers';
import mkdirp        from 'mkdirp';
import tmp           from 'tmp';
import Update        from '../src/lib/update';
import HealthChecker from '../src/lib/healthchecker';
import Storage       from '../src/lib/storage';

describe('The update module', () => {
  let app = null;
  let update = null;

  beforeEach(() => {
    const evergreenHome = tmp.dirSync({ unsafeCleanup: true }).name;
    process.env.EVERGREEN_DATA = evergreenHome;
    Storage.homeDirectory = (() => evergreenHome);
    mkdirp.sync(Storage.jenkinsHome());

    app = feathers();
    update = new Update(app);
    update.healthChecker = new HealthChecker('http://127.0.0.1:8080/', { delay: 50, retry: 5 });
    update.healthChecker.check = jest.fn(() => {
      return Promise.resolve({ message: 'fake' });
    });
    update.taintUpdateLevel = jest.fn(() => {
      return Promise.resolve(true);
    });
  });


  describe('applyUpdates()', () => {
    let manifest = null;
    beforeEach(() => {
      update.updateInProgress = false;
      manifest = {
        meta: { level: 1 },
        plugins: {},
      };
    });

    // Tests TODO:
    // * check we do not rollback UL0
    // * no rolling back twice
    // * when rolling back, applyUpdates can actually be called by itself to trigger the rollback

    it('should rollback if healthcheck goes wrong (and revert works)', async () => {
      jest.setTimeout(10000);
      // ====================================================
      // GIVEN a good update from initial/default UL0 to UL1
      expect(update.getCurrentLevel()).toBe(0);

      const ul1 = Object.assign({},
        manifest,
        {
          meta: { level: 1 },
          plugins: {
            updates: [
              {
                artifactId: 'daily-quote',
                url: 'http://updates.jenkins-ci.org/download/plugins/daily-quote/1.0/daily-quote.hpi',
                checksum: { signature: 'e0e6bf16f76f1627c1aa296d796c6cc55cdcca838ae5d144f698524b488a72c1' }
              }
            ]
          }
        }
        );
        const result1 = await update.applyUpdates(ul1);

        // Update to UL1 went OK
        expect(update.getCurrentLevel()).toBe(1);
        expect(result1).toBe(true);
        expect(update.healthChecker.check).toHaveBeenCalled();

      // ========================
      // WHEN a bad update to UL2
      const ul2 = Object.assign({}, ul1, { meta: { level: 2 } })
      ul2.plugins.updates = [
        {
          artifactId: 'evergreen',
          url: 'https://repo.jenkins-ci.org/incrementals/io/jenkins/plugins/evergreen/1.0-rc58.a9ecd200b39a/evergreen-1.0-rc58.a9ecd200b39a.hpi',
          checksum: { signature: 'd5fd13e57eb2cfb030bef235206f1b7c97fec5d158c2e8a0106cf8a6b0617de7' }
        }
      ];

      // change the healthchecking mock to force a failure *once*, hence a revert below
      update.healthChecker.check.mockImplementationOnce(() => {return Promise.reject(new Error('forced mock failure for healthchecking'))});

      // query cannot really call the backend side, so we mock it to return ul1
      update.query = jest.fn( () => {
        return Promise.resolve(ul1);
      });


      expect(update.taintUpdateLevel).not.toHaveBeenCalled(); // not yet, let's just double-check

      // update to broken UL2 (as healthchecking is stubbed above to fail)
      const result2 = await update.applyUpdates(ul2);

      expect(await update.healthChecker.check()).toBeTruthy();
      // ===============================
      // THEN we get an automated revert
      expect(update.taintUpdateLevel).toHaveBeenCalled();
      expect(update.query).toHaveBeenCalled();
      expect(update.getCurrentLevel()).toBe(1);

    });

  });
});
