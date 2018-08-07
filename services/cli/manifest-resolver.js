'use strict';

const path    = require('path');
const logger  = require('winston');
const request = require('request-promise');


const INCREMENTALS = 'https://repo.jenkins-ci.org/incrementals/';
const RELEASES     = 'https://repo.jenkins-ci.org/releases/';

/*
 * ManifestResolver is a simple class which takes a series of plugins and uses
 * their embedded information to generate a dependency tree
 */
class ManifestResolver {
  constructor(plugins) {
    this.plugins = plugins;
  }

  resolve() {
    this.plugins.forEach((plugin) => {
      if (this.isIncremental(plugin)) {
        logger.info(`${plugin.artifactId} is an incremental`);
      }
      else {
        logger.info(plugin.artifactId);
      }
      this.fetchManifestForPlugin(plugin);
    });

    return this;
  }

  /*
   * Fetch the MANIFEST.MF for the given plugin record
   *
   * @param {object} plugin record from essentials.yaml
   * @return {Promise}
   */
  fetchManifestForPlugin(plugin) {
    const start = Date.now();
    return request({
      uri: this.computeUrlForPlugin(plugin)
    }).then((res) => {
      logger.info(`Fetching ${plugin.artifactId} took ${Date.now() - start}`);
      return res;
    });
  }

  /*
   * Compute the Artifactory URL for the given plugin record
   *
   * @param {object} plugin record from essentials.yaml
   * @return {string} URL to Artifactory
   */
  computeUrlForPlugin(plugin) {
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
  isIncremental(plugin) {
    return !! plugin.version.match(/(.*?)-rc(\d+)\.(.*)?/);
  }
}

module.exports = ManifestResolver;
