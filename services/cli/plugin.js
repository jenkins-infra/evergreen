'use strict';

/*
 * Plugin represents a plugin whether its in the Update Center or an
 * incremental
 */

class Plugin {
  constructor() {
    this.artifactId = null;
    this.groupId = null;
    this.url = null;
    this.version = null;
    this.incremental = false;
  }
}


module.exports = Plugin;
