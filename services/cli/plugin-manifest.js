'use strict';

const PluginDependency = require('./plugin-dependency');

/*
 * Representation of a plugin's MANIFEST.MF
 */
class PluginManifest {
  constructor(data) {
    this.data = data;
    this.dependencies = [];
  }

  static load(data) {
    return new PluginManifest(data);
  }

  parse() {
    let dependencies = [];
    // Set to true if the next line is awrapped set of dependencies
    let depWrap = false;
    this.data.split('\n').forEach((line) => {
      if ((depWrap) && (!line.startsWith(' '))) {
        depWrap = false;
      }

      const matches = line.match(/^Plugin-Dependencies: (.*)?/);

      if (matches) {
        dependencies.push(matches[1]);
        depWrap = true;
      } else if (depWrap) {
        dependencies.push(line.trim());
      }
    });

    dependencies = dependencies.join('').split(',');

    this.dependencies = dependencies
      .map(entry => PluginDependency.fromEntry(entry))
      .filter(d => d);
    return this;
  }
}

module.exports = PluginManifest;


