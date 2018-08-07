'use strict';

const path    = require('path');
const logger  = require('winston');
const request = require('request-promise');
const compareVersions = require('compare-versions');

const PluginManifest = require('./plugin-manifest');

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
    const loadData = this.plugins.map((plugin) => {
      return this.fetchManifestForPlugin(plugin).then((data) => {
        return PluginManifest.load(plugin, data).parse();
      });
    });

    /*
     * Collect all our manifests and discover our common dependencies
     */
    return Promise.all(loadData).then((manifests) => {
      let sharedDependencies = {};

      manifests.forEach((manifest) => {
        manifest.pluginDependencies.forEach((dependency) => {
          if (!sharedDependencies[dependency.name]) {
            sharedDependencies[dependency.name] = [];
          }
          sharedDependencies[dependency.name].push(dependency);
        });
      });

      // Sort all the versions we need
      Object.values(sharedDependencies)
      .map(dependencies => dependencies.sort((left, right) => compareVersions(left.version, right.version)));

      // Grab the latest version for each plugin we require
      return Object.values(sharedDependencies).map(dependencies => dependencies.pop());
    });
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
      uri: `${this.computeUrlForPlugin(plugin)}!META-INF/MANIFEST.MF`,
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
