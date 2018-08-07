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
    this.processedNames = {};
    this.sharedDependencies = {};
    this.resolved = false;
  }

  resolve(plugins) {
    const self = this;

    /*
     * Reach out to Artifactory and grab all the first level dependency
     * MANIFEST.MF files and process them
     */
    const loadData = plugins
      .filter(plugin => !self.processedNames[plugin.artifactId]) /* avoid processing anything already handled */
      .map((plugin) => {
        return this.fetchManifestForPlugin(plugin).then((data) => {
          // TODO: convert this to a Plugin object
          self.processedNames[plugin.artifactId] = plugin;

          const manifest = PluginManifest.load(plugin, data).parse();

          /* XXX no group id for dependencies from manifests... */

          manifest.pluginDependencies
            .filter(dependency => !dependency.optional)
            .forEach((dependency) => {
              if (!self.sharedDependencies[dependency.artifactId]) {
                self.sharedDependencies[dependency.artifactId] = [];
              }
              self.sharedDependencies[dependency.artifactId].push(dependency);
          });
          return manifest;
        });
    });

    return Promise.all(loadData).then((manifests) => {
      return manifests.map(manifest => this.resolve(manifest.pluginDependencies))
    })
      .then(() => {
        this.resolved = true;
        return this;
    });
  }

  getResolutions() {
    if (!this.resolved) {
      throw new Error('cannot getResolutions() until resolve() has completed');
    }

    let resolutions = Object.values(this.sharedDependencies)
    .map(dependencies => dependencies.sort((a, b) => { return compareVersions(a.version, b.version); }).pop());

    return resolutions.concat(this.plugins);
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
