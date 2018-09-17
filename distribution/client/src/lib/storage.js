'use strict';

const path   = require('path');
const fs     = require('fs');
const logger = require('winston');
const UI     = require('./ui');

/*
 * The Storage module simply contains common functions necessary for the
 * evergreen-client to store its own data.
 */
class Storage {
  /*
   * Returns the default home directory or the value of EVERGREEN_HOME
   *
   * @return {string}
   */
  static homeDirectory() {
    /* The default home directory is /evergreen, see the Dockerfile in the root
     * directory of th repository
     */
    if (!process.env.EVERGREEN_DATA) {
      return '/evergreen/data';
    }
    return process.env.EVERGREEN_DATA;
  }

  /*
   * Returns the JENKINS_HOME used by the instance
   *
   * @return {string}
   */
  static jenkinsHome() {
    return path.join(
      Storage.homeDirectory(),
      'jenkins',
      'home');
  }

  /*
   * Returns the directory used for storing plugins
   *
   * @return {string}
   */
  static pluginsDirectory() {
    return path.join(Storage.jenkinsHome(),
      'plugins');
  }

  static getBootingFlagFile() {
    return path.join(Storage.homeDirectory(), 'booting.txt');
  }

  static setBootingFlag() {
    return fs.writeFileSync(Storage.getBootingFlagFile(), Date.now().toString());
  }

  static removeBootingFlag() {
    const filePath = Storage.getBootingFlagFile();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  static removePlugins(plugins) {
    if (!plugins) {
      return;
    }
    let pluginPath = this.pluginsDirectory();
    let retArray = [];
    plugins.forEach((plugin) => {
      retArray.push(fs.unlink(`${pluginPath}/${plugin}.hpi`, () => {
        logger.info(`${pluginPath}/${plugin}.hpi was deleted`);
        UI.publish(`Deleted ${plugin}.hpi`);
      }));
    });
    return retArray;
  }
}

module.exports = Storage;
