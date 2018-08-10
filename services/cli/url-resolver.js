'use strict';

const path = require('path');

const INCREMENTALS = 'https://repo.jenkins-ci.org/incrementals/';
const RELEASES     = 'https://repo.jenkins-ci.org/releases/';


/*
 * The URL Resolver will take a given plugin and return the URLs necessary for
 * a plugin
 */
class UrlResolver {
  /*
   * Compute the Artifactory URL for the given plugin record
   *
   * @param {object} plugin record from essentials.yaml
   * @return {string} URL to Artifactory
   */
  static artifactForPlugin(plugin) {
    const pluginFilename = path.join(plugin.artifactId, plugin.version, `${plugin.artifactId}-${plugin.version}.hpi`);
    const groupPath = plugin.groupId.replace(/\./g, '/');
    let url = `${RELEASES}${groupPath}/`;

    if (this.isIncremental(plugin)) {
      url = `${INCREMENTALS}${groupPath}/`;
    }
    return url + pluginFilename;
    return null;
  }

  /*
   * Determine whether the given plugin record represents an incremental plugin
   * or not
   *
   * @param {object} plugin record from the essentials.yaml
   * @return {boolean}
   */
  static isIncremental(plugin) {
    return !! plugin.version.match(/(.*?)-rc(\d+)\.(.*)?/);
  }
}

module.exports = UrlResolver;
