/*
 * The registration module is responsible for managing the initial registration
 * of the evergreen-client with the backend services layer
 */

const crypto = require('crypto');
const fs     = require('fs');
const logger = require('winston');
const path   = require('path');
const mkdirp = require('mkdirp');

class Registration {
  constructor (options) {
    this.options = options || {};
    this.publicKey = null;
    this.privateKey = null;

    this.privateKeyFilename = 'evergreen-private-key';
  }

  /*
   * Execute the registration process if the instance has not been registered,
   * otherwise just resolve the Promise
   *
   * @return Promise
   */
  register() {
    return new Promise(function(resolve, reject) {
      /*
       * If keys do not exist:
       *   - generate keys
       *   - save to disk
       *   - send registration request
       * else:
       *   - locate uuid on disk
       *   - sign uuid with private key
       *   - send login request
       */
    });
  }

  /*
   * Generate the keys necessary for this instance
   *
   * @return Boolean
   */
  generateKeys() {
    let ecdh = crypto.createECDH('secp521r1');
    let pubKey = ecdh.generateKeys('base64');
    logger.info('Generated public key:', pubKey);

    this.publicKey = pubKey;
    this.privateKey = ecdh.getPrivateKey('base64');

    /* If we have a private key, that's good enough! */
    if (this.privateKey) {
      return true;
    }

    return false;
  }

  /*
   * Return the base64 encoded public key associated with this instance
   *
   * Will return null if no public key has yet been generated
   *
   * @return String
   */
  getPublicKey() {
    return this.publicKey;
  }


  /*
   * Persist generated keys
   *
   * @return Boolean on success
   */
  saveKeysSync() {
    if ((!this.publicKey) || (!this.privateKey)) {
      logger.debug('saveKeysSync() called without a private or public key on Registration');
      return false;
    }

    const keyPath = this.keyPath();
    const publicKeyPath = this.publicKeyPath();
    const privateKeyPath = [keyPath, this.privateKeyFilename].join(path.sep);

    logger.debug('Writing public key to', publicKeyPath);
    fs.writeFileSync(publicKeyPath, this.publicKey);

    logger.debug('Writing private key to', privateKeyPath);
    fs.writeFileSync(privateKeyPath, this.privateKey);

    return true;
  }


  /*
   * Returns the default home directory or the value of EVERGREEN_HOME
   */
  homeDirectory() {
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
  hasKeys() {
    return false;
  }

  /* Return the directory where registration keys should be stored
   *
   * @return String
   */
  keyPath() {
    const keys = [this.homeDirectory(), 'keys'].join(path.sep);

    /* Only bother making the directory if it doesn't already exist */
    try {
      const dirStat = fs.statSync(keys);
    }
    catch (err) {
      if (err.code == 'ENOENT') {
        mkdirp.sync(keys);
      }
      else {
        throw err;
      }
    }

    return keys;
  }

  /* Return the absolute path to the evergreen public key
   *
   * This public key is safe to be shared with external services
   *
   * @return String
   */
  publicKeyPath() {
    return [this.keyPath(), 'evergreen.pub'].join(path.sep)
  }
}

module.exports = Registration
