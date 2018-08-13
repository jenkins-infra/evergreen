'use strict';

const path = require('path');

const INCREMENTALS = 'https://repo.jenkins-ci.org/incrementals/';
const RELEASES     = 'https://repo.jenkins-ci.org/releases/';
const WAR_MIRROR   = 'http://mirrors.jenkins.io/war/';


/*
 * The URL Resolver will take a given plugin and return the URLs necessary for
 * a plugin
 */
class UrlResolver {
  /*
   * Compute the mirrored or Artifactory URL for the given core record
   * @param {object} corerecord from essentials.yaml
   * @return {string} URL to Mirrors/Artifactory
   */
  static artifactForCore(core) {
    if (this.isIncremental(core)) {
      return `${INCREMENTALS}org/jenkins-ci/main/jenkins-war/${core.version}/jenkins-war-${core.version}.war`;
    }
    return `${WAR_MIRROR}${core.version}/jenkins.war`;
  }
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
