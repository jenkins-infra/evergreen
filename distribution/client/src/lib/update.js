/*
 * This module is responsible for coordinating the updates with the Update
 * service, see:
 *  https://github.com/jenkinsci/jep/tree/master/jep/307
 */

const fs      = require('fs');
const path    = require('path');
const mkdirp  = require('mkdirp');
const logger  = require('winston');

const storage     = require('./storage');
const Downloader  = require('./downloader');
const Supervisord = require('./supervisord');

class Update {
  constructor(app, options) {
    this.options = options || {};
    this.app = app;
    this.token = null;
    this.uuid = null;
    this.manifest = null;
    this.updateInProgress = null;
    this.fileOptions = { encoding: 'utf8' };
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
      headers: { Authorization: this.token },
      json: true,
      query: {
        level: this.getCurrentLevel(),
      }
    });
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
    logger.debug('applying updates', updates);
    // Setting this to a timestamp to make a timeout in the future
    this.updateInProgress = new Date();
    let tasks = [];

    const outputDir = path.join(storage.homeDirectory(),
      'jenkins',
      'home');

    if ((updates.core) && (updates.core.url)) {
      tasks.push(this.fetchTo(updates.core.url, outputDir));
    }

    if ((!updates.plugins) || (!updates.plugins.updates)) {
      logger.debug('No plugins available in the response');
      return false;
    }

    /*
     * Queue up all the downloads simultaneously, we need updates ASAP!
     */
    updates.plugins.updates.forEach((plugin) => {
      let pluginsPath = path.join(outputDir, 'plugins');
      tasks.push(this.fetchTo(plugin.url, pluginsPath));
    });

    return Promise.all(tasks).then(() => {
      logger.info('All downloads completed, restarting Jenkins');
      this.saveUpdateSync(updates);
      Supervisord.restartProcess('jenkins');
      this.updateInProgress = null;
      return true;
    });
  }

  /*
   * Fetch the given URL and download it into the output path with a log
   * message
   */
  async fetchTo(url, outputPath) {
    return Downloader.download(url, outputPath);
  }

  getCurrentLevel() {
    this.loadUpdateSync();
    if (this.manifest) {
      let level = this.manifest.meta.level;
      logger.debug('Currently at update level %d', level);
      return level;
    }
    return 0;
  }

  saveUpdateSync(manifest) {
    logger.info('Saving a new manifest..');
    fs.writeFileSync(
      this.updatePath(),
      JSON.stringify(manifest),
      this.fileOptions);
    return true;
  }

  loadUpdateSync() {
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
      this.fileOptions));
    return this.manifest;
  }

  /*
   * Returns a path to the stored information about the current updates levels
   * and other important information
   *
   * @return String
   */
  updatePath() {
    const dir = path.join(storage.homeDirectory(), 'updates.json');

    try {
      fs.statSync(dir);
    } catch (err) {
      if (err.code == 'ENOENT') {
        mkdirp.sync(storage.homeDirectory());
      } else {
        throw err;
      }
    }
    return dir;
  }
}

module.exports = Update;
