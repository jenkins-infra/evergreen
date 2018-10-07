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

  async taintUpdateLevel(levelToTaint) {
    let toBeTaintedLevel = levelToTaint;
    if (!toBeTaintedLevel) {
      toBeTaintedLevel = this.getCurrentLevel();
    }
    logger.warn(`Tainting UL ${toBeTaintedLevel}`);
    return this.app.service('update/tainted').create({
      uuid: this.uuid,
      level: toBeTaintedLevel
    }, {});
  }
  /*
   * Apply the updates provided by the given Update Manifest
   *
   * @param  {Map} Update Manifest described in JEP-307
   * @return {Promise} Which resolves once updates have been applied
   * @return {boolean} False if there is already an update in progress
   */
  async applyUpdates(updates) {
    if (this.updateInProgress || (!updates)) {
      return false;
    }

    UI.publish('Starting to apply updates');
    // Setting this to a timestamp to make a timeout in the future
    this.updateInProgress = new Date();
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
      logger.debug('No actionable tasks');
      this.updateInProgress = null;
      this.saveUpdateSync(updates);
      return false;
    }

    return Promise.all(tasks).then(() => {
      UI.publish('All downloads completed, snapshotting data before restart');
      this.snapshotter.snapshot(`UL${this.getCurrentLevel()}->UL${updates.meta.level} Snapshot after downloads completed, before Jenkins restart`);
      this.saveUpdateSync(updates);
      UI.publish('All downloads completed and snapshotting done, restarting Jenkins');
      this.restartJenkins();
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
  restartJenkins(rollingBack?: boolean) { // Add param to stop recursion?
    Supervisord.restartProcess('jenkins');

    const messageWhileRestarting = 'Jenkins should now be online, health checking!';
    UI.publish(messageWhileRestarting);
    logger.info(messageWhileRestarting);

    // FIXME: actually now I'm thinking throwing in HealthChecker might provide a more
    // consistent promise usage UX here.
    // checking healthState.health value is possibly a bit convoluted (?)
    this.healthChecker.check()
      .then( healthState => {
        if (healthState.healthy) {
          logger.info('Jenkins healthcheck after restart succeeded! Yey.');
        } else {

          if (rollingBack) {

            // if things are wrong twice, stop trying and just holler for help
            // Quick notice sketch, but I do think we need a very complete and informative message
            const failedToRollbackMessage =
              'Ooh noes :-(. We are terribly sorry but it looks like Jenkins failed to ' +
              'upgrade, but even after the automated rollback we were unable to bring ' +
              'to life. Please report this issue to the Jenkins Evergreen team. ' +
              'Do not shutdown your instance as we have been notified of this failure ' +
              'and are trying to understand what went wrong to push a new update that ' +
              'will fix things.';
            logger.error(failedToRollbackMessage);
            UI.publish(failedToRollbackMessage);

            // Not throwing an Error here as we want the client to keep running and ready
            // since the next available UL _might_ fix the issue
          } else {

            const errorMessage = `Jenkins detected as unhealthy: ${healthState.message}. ` +
                                 'Rolling back to previous update level.';
            UI.publish(errorMessage);
            logger.warn(errorMessage);

            this.snapshotter.revertToLevelBefore(this.getCurrentLevel());
            this.revertToPreviousUpdateLevel();
            this.restartJenkins(true);
          }
        }
        Storage.removeBootingFlag();
      }).catch((errors) => {
        logger.warn(`TODO ${errors}`);
      }); // TODO catch?
  }

  revertToPreviousUpdateLevel() {
    logger.error(`[NOT IMPLEMENTED YET] Revert UL-${this.getCurrentLevel()} to previous Update Level`);
  }

  getCurrentLevel() {
    this.loadUpdateSync();
    if (this.manifest) {
      const level = this.manifest.meta.level;
      logger.silly('Currently at Update Level %d', level);
      return level;
    }
    return 0;
  }

  saveUpdateSync(manifest) {
    logger.info(`Saving a new manifest into ${this.updatePath()}`);
    fs.writeFileSync(
      this.updatePath(),
      JSON.stringify(manifest),
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
    const dir = path.join(Storage.homeDirectory(), 'updates.json');

    try {
      fs.statSync(dir);
    } catch (err) {
      if (err.code == 'ENOENT') {
        mkdirp.sync(Storage.homeDirectory());
      } else {
        throw err;
      }
    }
    return dir;
  }
}
