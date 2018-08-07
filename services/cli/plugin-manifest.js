'use strict';

const fs = require('fs');

const PluginDependency = require('./plugin-dependency');

/*
 * Representation of a plugin's MANIFEST.MF
 */
class PluginManifest {
  constructor(fileName) {
    this.fileName = fileName;
    this.manifest = null;
    this.pluginDependencies = [];
  }

  load() {
    this.manifest = fs.readFileSync(this.fileName);
    return this;
  }

  parse() {
    let dependencies = [];
    // Set to true if the next line is awrapped set of dependencies
    let depWrap = false;
    this.manifest.split('\n').forEach((line) => {
      if ((depWrap) && (!line.startsWith(' '))) {
        depWrap = false;
      }

      const matches = line.match(/^Plugin-Dependencies: (.*)?/);

      if (matches) {
        dependencies.push(matches[1])
        depWrap = true;
      }
      else if (depWrap) {
        dependencies.push(line.trim());
      }
    });

    dependencies = dependencies.join('').split(',');

    this.pluginDependencies.concat(
      dependencies.map(entry => PluginDependency.fromEntry(entry))
    );
    return this;
  }
}

module.exports = PluginManifest;


