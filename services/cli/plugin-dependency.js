'use strict';

/*
 * Representation of a plugin dependency defined by a plugin's manifest
 */
class PluginDependency {
  constructor() {
    this.artifactId = null;
    this.version = null;
    this.optional = false;
    this.dependencies = [];
  }

  isOptional() {
    return this.optional;
  }

  /*
   * Return the object based on an entry in MANIFEST.MF's Plugin-Dependencies
   * metadata
   *
   * @param {string} Entry from the comma separated list
   * @return {PluginDependency}
   * @return {null} if there is no dependency
   */
  static fromEntry(line) {
    if (!line) {
      return null;
    }

    let dependency = new PluginDependency();
    dependency.optional = !! line.match(/=optional/);

    // credentials:2.1.16;resolution:=optional
    // eslint-disable-next-line no-unused-vars
    const [spec, unused] = line.split(';');
    const [artifactId, version] = spec.split(':');
    dependency.artifactId = artifactId;
    dependency.version = version;
    return dependency;
  }

  /*
   * Return an object based on the record from essentials.yaml
   *
   * @param {object} plugin record from the essentials.yaml format
   * @return {PluginDependency}
   */
  static fromRecord(record) {
    let dependency = new PluginDependency();
    dependency.version = record.version;
    dependency.groupId = record.groupId;
    dependency.artifactId = record.artifactId;

    return dependency;
  }
}

module.exports = PluginDependency;
