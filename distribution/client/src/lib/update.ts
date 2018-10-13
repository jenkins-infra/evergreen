/*
 * This module is responsible for coordinating the updates with the Update
 * service, see:
 *  https://github.com/jenkinsci/jep/tree/master/jep/307
 */

import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import * as logger from 'winston';

import Downloader    from './downloader';
import HealthChecker from './healthchecker';
import Storage       from './storage';
import Supervisord   from './supervisord';
import UI            from './ui';
import Snapshotter   from './snapshotter';
import Status        from './status';

export interface FileOptions {
  encoding?: string,
  flag?: string,
};

export default class Update {
  protected readonly app : any;
  protected readonly snapshotter : Snapshotter;
  protected readonly fileOptions : FileOptions;
  protected readonly options : any;
  protected readonly healthChecker : HealthChecker;
  protected readonly status : Status;

  public uuid : string;
  public token : string;
  public manifest : any;
  public updateInProgress : Date;

  constructor(app, options = {}) {
    this.app = app;
    this.options = options;
    this.fileOptions = { encoding: 'utf8' };
    this.snapshotter = new Snapshotter();
    this.snapshotter.init(Storage.jenkinsHome());
    /*
     * This is typically going to be passed in by the Client, but some tests
     * may not define a health checker
     */
    if (this.options.healthChecker) {
      this.healthChecker = this.options.healthChecker;
    } else {
      this.healthChecker = new HealthChecker(process.env.JENKINS_URL || 'http://127.0.0.1:8080');
    }

    if (this.options.status) {
      this.status = this.options.status;
    } else {
      this.status = this.status = new Status(this.app, { flavor: process.env.FLAVOR });
    }
  }

  authenticate(uuid, token) {
    this.uuid = uuid;
    this.token = token;
    return this;
  }

  /*
   * Query the update API for the updates pertaining to our client.
   *
   * @return {Promise} Promise resolving to the Update Manifest from the server
   */
  async query() {
    return this.app.service('update').get(this.uuid, {
      json: true,
      query: {
        level: this.getCurrentLevel(),
      }
    });
  }

  async taintUpdateLevel(levelToTaint?: number) {
    let toBeTaintedLevel = levelToTaint;
    if (!toBeTaintedLevel) {
      toBeTaintedLevel = this.getCurrentLevel();
    }
    logger.warn(`Tainting UL ${toBeTaintedLevel}`);
    return this.app.service('update/tainted').create({
      uuid: this.uuid,
      level: toBeTaintedLevel
    }, {})
    .catch( (e) => {
      logger.error('Tainting went wrong!', e);
      throw e;
    });
  }
  /*
   * Apply the updates provided by the given Update Manifest.
   * Rolls back automatically to the previous non tainted level if failing.
   * (Note: the rollback may not end up on most of the time, that would mean going from say UL-0 to U)

   1) UL10 gets globally tainted after an issue is identified (UL9 is not tainted)
   2) Instance attempts updating from UL10 to UL11, and fails
   3) update.query() to get the right updates => receives UL9...
   4) config files changed from UL9 to UL10, Jenkins fails to start after rolling back.

   * @param  {Map} Update Manifest described in JEP-307
   * @return {Promise} Which resolves once updates have been applied
   * @return {boolean} False if there is already an update in progress
   */
  async applyUpdates(updates, forceUpdate?: boolean) {
    if (forceUpdate) {
      logger.warn('Forced update (expected during a rollback)');
    }
    else if (this.updateInProgress || (!updates)) {
      logger.warn('applyUpdates request ignored: update already in progress!');
      return false;
    } else {
      // Setting this to a timestamp to make a timeout in the future
      this.updateInProgress = new Date();
    }
    UI.publish('Starting to apply updates', { log: 'info' });

    const tasks = [];

    if ((updates.core) && (updates.core.url)) {
      tasks.push(Downloader.download(updates.core.url,
        Storage.jenkinsHome(),
        'jenkins.war',
        updates.core.checksum.signature));
    }

    // FIXME: check updates.meta.level is specified

    /*
     * Queue up all the downloads simultaneously, we need updates ASAP!
     */
    if (updates.plugins.updates) {
      updates.plugins.updates.forEach((plugin) => {
        logger.info('Downloading', plugin);
        tasks.push(Downloader.download(plugin.url,
          Storage.pluginsDirectory(),
          `${plugin.artifactId}.hpi`,
          plugin.checksum.signature));
      });
    }

    if (updates.plugins.deletes) {
      tasks.push(Storage.removePlugins(updates.plugins.deletes));
    }

    if (tasks.length == 0) {
      logger.warn('No actionable tasks');
      this.updateInProgress = null;
      this.saveUpdateSync(updates);
      return true;
    }

    logger.info(`Triggering update with tasks: ${tasks}`);

    return Promise.all(tasks).then(() => {

      UI.publish('All downloads completed, snapshotting data before restart');
      this.snapshotter.snapshot(`UL${this.getCurrentLevel()}->UL${updates.meta.level} Snapshot after downloads completed, before Jenkins restart`);
      this.saveUpdateSync(updates);
      UI.publish('All downloads completed and snapshotting done, restarting Jenkins');

    }).then( () => {

      return this.restartJenkins();

    }).finally( () => {

      this.updateInProgress = null;
      return true;

    });
  }

  /*
   * From outside, this method is responsible for restarting Jenkins,
   * and have it back.

   * Meaning, it will either be able to start, or will automatically
     revert to the previous state,
   * i.e. before any updates were applied.
   * 1) restart Jenkins
   * 2) Check health
   * 3) if OK, continue
   * 4) if KO, rollback state + go back to previous UL.
   *
   * But what if Jenkins does not restart even after rollback?
     we will not try to go back further. But the client will stay

     Open questions:
     * how to avoid going again through this UL that borked the system,
       while it's not been yet marked as tainted in the backend?
     * how to report that borked case in a clear way
  */
  restartJenkins() {

    const jenkinsIsRestarting = Supervisord.restartProcess('jenkins');

    UI.publish('Jenkins is being restarted, health checking!', { log: 'info' });

    return jenkinsIsRestarting
      .then(() => this.healthChecker.check())
      .then(() => {
        logger.info('Jenkins healthcheck after restart succeeded! Yey.');
        return true;

      }).catch((error) => { // first catch, try rolling back

        UI.publish(`Jenkins detected as unhealthy. Rolling back to previous update level (${error}).`, {log: 'warn'});

        return this.revertToPreviousUpdateLevel(); // FIXME: async issue!

      }).catch((error) => { // second time wrong, stop trying and just holler for help

        // Quick notice sketch, but I do think we need a very complete and informative message
        const failedToRollbackMessage =
          'Ooh noes :-(. We are terribly sorry but it looks like Jenkins failed to ' +
          'upgrade, but even after the automated rollback we were unable to bring ' +
          'to life. Please report this issue to the Jenkins Evergreen team. ' +
          'Do not shutdown your instance as we have been notified of this failure ' +
          'and are trying to understand what went wrong to push a new update that ' +
          'will fix things.';
        UI.publish(failedToRollbackMessage, { log: 'error' });

        // Not throwing an Error here as we want the client to keep running and ready
        // since the next available UL _might_ fix the issue

      }).finally(() => {
        Storage.removeBootingFlag();
        return true;
      });

  }

  /*
   * 1) Taint current level
   * 2) query and trigger a new update
   *    (failing UL has been marked tainted for the instance, so should be served the/a previous UL)
   * FIXME: 'the/a previous UL' => current code will serve "a" UL. We actually want "the"
   */
  revertToPreviousUpdateLevel() {
    this.snapshotter.revertToLevelBefore(this.getCurrentLevel()); // TODO test this

    return this.status.reportVersions() // critical so that the subsequent query correctly computes the diff
      .then( () => {
        return this.taintUpdateLevel();
      }).then( () => {
        logger.info('Immediately Querying a new update level to go to (could be a previous one, if no new is available)')
        return this.query();

      }).then(updates => {
        logger.info(`Updating to the following received update: ${JSON.stringify(updates)}`);
        return this.applyUpdates(updates, true);

      }).catch( e => {
        logger.error('Something went wrong during revertToPreviousUpdateLevel! ', e);
        throw e;
      });

  }

  getCurrentLevel() {
    this.loadUpdateSync();
    if (this.manifest && this.manifest.meta && this.manifest.meta.level) {
      const level = this.manifest.meta.level;
      logger.silly('Currently at Update Level %d', level);
      return level;
    }
    logger.warn(`No manifest level found, returning UL 0 (manifest=${this.manifest})`);
    return 0;
  }

  saveUpdateSync(manifest) {
    if (!manifest) {
      throw new Error('Update Manifest is required!');
    }
    logger.info(`Saving a new manifest into ${this.updatePath()}`);
    fs.writeFileSync(
      this.updatePath(),
      JSON.stringify(manifest),
      this.fileOptions);

    this.recordUpdateLevel(manifest);
    return true;
  }

  /**
   * Function for audit/debugging purpose. Store in a file the successive ULs an instance went through
  */
  recordUpdateLevel(manifest) {
    logger.debug('Storing Update Level for auditability');
    const level = this.getCurrentLevel();
    const log = {timestamp: new Date(), updateLevel: level, 'manifest': manifest};
    const logLine = JSON.stringify(log);

    fs.appendFileSync(this.auditLogPath(),
      `${logLine}\n`,
      this.fileOptions);
    return true;
  }

  loadUpdateSync() {
    logger.debug(`Loading a new manifest from ${this.updatePath()}`);
    try {
      fs.statSync(this.updatePath());
    } catch (err) {
      if (err.code == 'ENOENT') {
        return null;
      } else {
        throw err;
      }
    }
    this.manifest = JSON.parse(fs.readFileSync(this.updatePath(),
      this.fileOptions) as string);
    return this.manifest;
  }

  /*
   * Returns a path to the stored information about the current updates levels
   * and other important information
   *
   * @return String
   */
  updatePath() {
    const filePath = path.join(Storage.homeDirectory(), 'updates.json');

    try {
      fs.statSync(filePath);
    } catch (err) {
      if (err.code == 'ENOENT') {
        mkdirp.sync(Storage.homeDirectory());
      } else {
        throw err;
      }
    }
    return filePath;
  }

  auditLogPath() {
    const filePath = path.join(Storage.homeDirectory(), 'updates.auditlog');
    try {
      fs.statSync(filePath);
    } catch (err) {
      if (err.code == 'ENOENT') {
        mkdirp.sync(Storage.homeDirectory());
      } else {
        throw err;
      }
    }
    return filePath;
  }
}
