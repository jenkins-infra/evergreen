'use strict';

const path    = require('path');
const logger  = require('winston');
const request = require('request-promise');
const compareVersions = require('compare-versions');

const PluginManifest   = require('./plugin-manifest');
const PluginDependency = require('./plugin-dependency');
const UrlResolver      = require('./url-resolver');

/*
 * ManifestResolver is a simple class which takes a series of plugins and uses
 * their embedded information to generate a dependency tree
 */
class ManifestResolver {
  constructor() {
    this.needed = {};
    this.depCache = {};
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
   * @return {Promise}
   */
  resolve(plugins, registryData) {
    return Promise.all(
      this.resolveTree(
        plugins.map(r => PluginDependency.fromRecord(r)),
        registryData
      )
    )
      .then(() => {
        this.resolved = true;
      });
  }

  resolveTree(tree, registryData) {
    return tree
      .filter(plugin => !plugin.optional)
      .map(async (plugin) => {
        logger.debug(`Resolving ${plugin.artifactId}:${plugin.version}`);

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
          const groupFromRegistry = registryData[plugin.artifactId].groupId;
          if  (!groupFromRegistry) {
            throw new Error(
              `Lacking the groupId information for '${plugin.artifactId}' necessary to complete full resolution`);
          }
          plugin.groupId = groupFromRegistry;
        }

        const artifactId = plugin.artifactId;
        if (this.needed[artifactId]) {
          // The plugin version requested is lower than one we already have.
          if (compareVersions(this.needed[artifactId].version, plugin.version)) {
            return null;
          }
        }

        this.needed[plugin.artifactId] = plugin;

        const cacheKey = `${plugin.artifactId}:${plugin.version}`;
        let manifest = this.depCache[cacheKey];

        if (!this.depCache[cacheKey]) {
          logger.debug(`Cache miss on ${cacheKey}`);
          const data = await this.fetchManifestForPlugin(plugin);
          manifest = PluginManifest.load(plugin, data).parse();
          this.depCache[cacheKey] = manifest;
        } else {
          logger.debug(`Cache hit ${cacheKey}`);
        }

        if (manifest.dependencies) {
          plugin.dependencies = (await Promise.all(
            this.resolveTree(manifest.dependencies, registryData))).filter(d => d);
        }
        return plugin;
      });
  }


  getResolutions() {
    if (!this.resolved) {
      throw new Error('cannot getResolutions() until resolve() has completed');
    }
    return Object.values(this.needed);
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
        uri: `${UrlResolver.artifactForPlugin(plugin)}!META-INF/MANIFEST.MF`,
    }).then((res) => {
      logger.debug(`Fetching ${plugin.artifactId} took ${Date.now() - start}`);
      return res;
    });
  }
}

module.exports = ManifestResolver;
