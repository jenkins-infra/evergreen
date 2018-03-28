/*
 * The registration module is responsible for managing the initial registration
 * of the evergreen-client with the backend services layer
 */

const path   = require('path');

class Registration {
  /*
   * Returns the default home directory or the value of EVERGREEN_HOME
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
   * Determine whether the keys are already present on the filesystem
   *
   * @return Boolean
   */
  static hasKeys() {
    return false;
  }

  /* Return the directory where registration keys should be stored
   *
   * @return String
   */
  static keyPath() {
    return [this.homeDirectory(),
      'keys'].join(path.sep);
  }

  /* Return the absolute path to the evergreen public key
   *
   * This public key is safe to be shared with external services
   *
   * @return String
   */
  static publicKeyPath() {
    return [this.keyPath(), 'evergreen.pub'].join(path.sep)
  }
}

module.exports = Registration
