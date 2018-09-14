/*
 * This module contains functions which are helpful for running across multiple
 * tests
 */
const fs            = require('fs');

class Helpers {
  constructor () {
  }

  checkFileExists(filename) {
    return new Promise(r=>fs.access(filename, fs.F_OK, e => r(!e)));
  }

  touchFile(filename) {
    return new Promise((resolve, reject) => {
      fs.open(filename, 'w', (err, fd) => {
        err ? reject(err) : fs.close(fd, err => {
          err ? reject(err) : resolve(fd);
        });
      });
    });
  }
}

module.exports = new Helpers();