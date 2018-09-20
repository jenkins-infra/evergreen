/*
 * This module contains functions which are helpful for running across multiple
 * tests
 */
const fs = require('fs');
const { promisify } = require('util');
const open = promisify(fs.open);
const close = promisify(fs.close);
const access = promisify(fs.access);

class Helpers {
  constructor () {
  }

  checkFileExists(filename) {
    return access(filename, fs.F_OK, () => {
      return false;
    });
  }

  touchFile(filename) {
    return open(filename, 'w').then(close);
  }
}

module.exports = new Helpers();