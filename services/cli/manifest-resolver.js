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

  /*
   * Recursively resolve the PluginDependencys for the given array of
   * PluginsManifests
   *
   * @param {Array} of PluginManifest compatible objects
   * @param {Map} Optional registry data which contains info such as
   *  groupId<->artifactId mappings, etc.
   *
   * @return {Array}
   */
  resolve(plugins, registryData) {
    const self = this;

    /*
     * Reach out to Artifactory and grab all the first level dependency
     * MANIFEST.MF files and process them
     */
    const loadData = plugins
      .filter(plugin => !self.processedNames[plugin.artifactId]) /* avoid processing anything already handled */
      .map((plugin) => {
        /*
         * Second-order dependencies not directly specified in the
         * essentials.yaml will lack groupIds due to the nature of the
         * Plugin-Dependencies metadata in MANIFEST.MF.
         *
         * By providing `registryData`, typically from the Update Center, we
         * can guarantee a mapping from an artifactId to its groupId, which is
         * necessary for finding the artifact in Artifactory
         */
        if (!plugin.groupId) {
          logger.info(`Looking up ${plugin.artifactId} in the registry`);
          const groupFromRegistry = registryData[plugin.artifactId].groupId;
          if  (!groupFromRegistry) {
            throw new Error(
              `Lacking the groupId information for '${plugin.artifactId}' necessary to complete full resolution`);
          }
          plugin.groupId = groupFromRegistry;
        }

        return this.fetchManifestForPlugin(plugin).then((data) => {
          // TODO: convert this to a Plugin object
          self.processedNames[plugin.artifactId] = plugin;

          const manifest = PluginManifest.load(plugin, data).parse();

          /* XXX no group id for dependencies from manifests... */

          manifest.pluginDependencies = manifest.pluginDependencies
            .filter(dependency => !dependency.optional)
            .map((dependency) => {
              if (!self.sharedDependencies[dependency.artifactId]) {
                self.sharedDependencies[dependency.artifactId] = dependency;
                return dependency;
              }
              else {
                /*
                 * Only add the dependency if the version is newer than what we
                 * already have
                 */
                 const existing = self.sharedDependencies[dependency.artifactId];
                 if (compareVersions(dependency.version, existing.version)) {
                   self.sharedDependencies[dependency.artifactId] = dependency;
                   /*
                    * This newer version might have newer dependencies, purge
                    * it from the processed list
                    */
                   self.processedNames[dependency.artifactId] = null;
                   return dependency;
                 }
                 else {
                   /*
                    * If the existing dependency is the one we already know
                    * about, return that as our dependency
                    */
                    return self.sharedDependencies[dependency.artifactId];
                 }
              }
          });
          return manifest;
        });
    });

    return Promise.all(loadData).then((manifests) => {
      return manifests.map(manifest => this.resolve(manifest.pluginDependencies, registryData))
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
    return Object.values(this.sharedDependencies).concat(this.plugins);
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
