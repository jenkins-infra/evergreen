'use strict';

import fs   from 'fs-extra';
import path from 'path';

import * as logger from 'winston';
import UI from './ui';

import util from 'util';

const remove = util.promisify(fs.remove);
const unlink = util.promisify(fs.unlink);

/*
 * The Storage module simply contains common functions necessary for the
 * evergreen-client to store its own data.
 */
export default class Storage {
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

  static jenkinsVar() {
    return path.join(
      Storage.homeDirectory(),
      'jenkins',
      'var');
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

  static removePlugins(plugins?: Array<any>) {
    if (!plugins) {
      return;
    }
    const pluginPath = this.pluginsDirectory();
    const retArray = [];
    plugins.forEach((plugin) => {
      retArray.push(
        remove(`${pluginPath}/${plugin}`)
          .then(() => {
            logger.info(`${pluginPath}/${plugin} was deleted.`);
            return true;
          }).catch(() => logger.debug(`${pluginPath}/${plugin} was not found.`))
      );
      retArray.push(
        unlink(`${pluginPath}/${plugin}.hpi`)
          .then(() => {
            logger.info(`${pluginPath}/${plugin}.hpi was deleted.`);
            UI.publish(`Deleted ${plugin}.hpi`);
            return true;
          }).catch(() => logger.info(`${pluginPath}/${plugin}.hpi was not found.`))
      );
      retArray.push(
        unlink(`${pluginPath}/${plugin}.jpi`)
          .then(() => {
            logger.info(`${pluginPath}/${plugin}.jpi was deleted.`);
            UI.publish(`Deleted ${plugin}.jpi`);
            return true;
          }).catch(() => logger.debug(`${pluginPath}/${plugin}.jpi was not found.`))
      );
    });
    return Promise.all(retArray);
  }
}
