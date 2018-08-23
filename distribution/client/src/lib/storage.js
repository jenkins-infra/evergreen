'use strict';

const path = require('path');


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
    if (!process.env.EVERGREEN_HOME) {
      return '/evergreen';
    }
    return process.env.EVERGREEN_HOME;
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
}

module.exports = Storage;
