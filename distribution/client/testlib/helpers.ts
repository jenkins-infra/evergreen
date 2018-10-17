/*
 * This module contains functions which are helpful for running across multiple
 * tests
 */
import fs from 'fs';

export class Helpers {
  constructor () {
  }

  checkFileExists(filename) {
    return fs.existsSync(filename);
  }

  touchFile(filename) {
    return fs.closeSync(fs.openSync(filename, 'w'));
  }
}

export default new Helpers();
