'use strict';

const fs     = require('fs');
const yaml   = require('js-yaml');

const DEFAULT_FILENAME = './essentials.yaml';

/*
 * Wrapper for the essentials.yaml
 */
class Manifest {
  constructor(data, fileName) {
    this.data = data;
    this.fileName = fileName;
  }

  /*
   * Read an essentials.yaml and build a Manifest object
   *
   * @param {string} optional path to an essentials.yaml file
   * @return {Manifest}
   */
  static loadFile(fileName) {
    if (!fileName) {
      fileName = DEFAULT_FILENAME;
    }
    return new Manifest(
      yaml.safeLoad(fs.readFileSync(fileName)),
      fileName
    );
  }

  saveSync() {
    return fs.writeFileSync(this.fileName, yaml.safeDump(this.data));
  }

  getPlugins() {
    return this.data.spec.plugins;
  }

  getCore() {
    return this.data.spec.core;
  }

  setStatus(status) {
    this.data.status = status;
  }

  getEnvironments() {
  }

  getRealizedPlugins() {
  }
}

module.exports = Manifest;
