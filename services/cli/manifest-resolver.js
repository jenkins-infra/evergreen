'use strict';

const logger          = require('winston');
const request         = require('request-promise');
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
    this.environmentNeeded = {};
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
    let needed = {};
    return Promise.all(
      this.resolveTree(
        plugins.map(r => PluginDependency.fromRecord(r)),
        registryData,
        needed
      )
    )
      .then((values) => {
        this.resolved = true;
        this.needed = needed;
        this.tree = values;
      });
  }

  resolveTree(tree, registryData, needed) {
    return tree
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

          /*
           * Some plugins list optional dependencies which have since been
           * removed from the Update Center, e.g. the `perforce` plugin
           */
          if ((plugin.optional) && (!registryData[plugin.artifactId])) {
            logger.info(`Optional plugin which is not resolvable being dropped: ${plugin.artifactId} ${plugin.version}`);
            return null;
          }

          const groupFromRegistry = registryData[plugin.artifactId].groupId;
          if  (!groupFromRegistry) {
            throw new Error(
              `Lacking the groupId information for '${plugin.artifactId}' necessary to complete full resolution`);
          }
          plugin.groupId = groupFromRegistry;
        }

        const artifactId = plugin.artifactId;
        if (needed[artifactId]) {
          if (!needed[artifactId].optional) {
            plugin.optional = false;
          }

          // The plugin version requested is lower than one we already have.
          if (compareVersions(needed[artifactId].version, plugin.version) == 1) {
            if (!plugin.optional) {
              /*
              * If version of the plugin which is already present is considered
              * non-optional, and the _newer_ version is optional, we need to
              * toggle the optional flag
              */
              needed[artifactId].optional = false;
            }
            return null;
          }
        }

        needed[plugin.artifactId] = plugin;

        const cacheKey = `${plugin.artifactId}:${plugin.version}`;
        let manifest = this.depCache[cacheKey];

        if (!this.depCache[cacheKey]) {
          logger.debug(`Cache miss on ${cacheKey}`);
          const data = await this.fetchManifestForPlugin(plugin);
          manifest = PluginManifest.load(data).parse();
          this.depCache[cacheKey] = manifest;
        } else {
          logger.debug(`Cache hit ${cacheKey}`);
        }

        if (manifest.dependencies) {
          plugin.dependencies = (await Promise.all(
            this.resolveTree(manifest.dependencies, registryData, needed))).filter(d => d);
          plugin.nonOptional = plugin.dependencies.filter(p => !p.optional);
        }
        return plugin;
      });
  }


  /*
   * Taking the graph into consideration, return an Array of artifactIds for
   * all the non-optional plugins
   */
  collapseNonOptional(tree, output) {
    tree.map((pluginDependency) => {
      output[pluginDependency.artifactId] = pluginDependency;

      pluginDependency.nonOptional.map((dep) => {
        output[dep.artifactId] = dep;
        this.collapseNonOptional(dep.nonOptional, output);
      });
    });
    return output;
  }

  getResolutions() {
    if (!this.resolved) {
      throw new Error('cannot getResolutions() until resolve() has completed');
    }
    /*
     * Filter out all the optional dependencies which we no longer need
     */
    const required = this.collapseNonOptional(this.tree, {});
    return Object.values(this.needed).filter(p => required.hasOwnProperty(p.artifactId));
  }

  getEnvironmentResolutions() {
    return this.environmentNeeded;
  }


  /*
   * resolveEnvironments() will start with the base resolutions, and create a
   * supplemental list of plugins required for that environment
   */
  resolveEnvironments(environments, registryData, baseResolutions) {
    if (!this.resolved) {
      throw new Error('resolveEnvironments() can only be called after the first pass on resolve() has completed');
    }
    let needed = {};
    const baseMap = {};
    baseResolutions.forEach(r => baseMap[r.artifactId] = r);

    return Promise.all(environments.map((entry) => {
      const name = entry.name;
      needed[name] = Object.assign({}, baseMap);

      return Promise.all(this.resolveTree(
        entry.plugins.map(r => PluginDependency.fromRecord(r)),
        registryData,
        needed[name]));
    }))
      .then(() => {
        Object.keys(needed).forEach((environment) => {
          const deps = needed[environment];
          let envNeeds = {};

          Object.keys(deps).filter((dep) => {
            const baseDep = baseMap[dep];
            const envDep = deps[dep];

            // Keep this if there's no base dependency
            if (!baseDep) {
              return true;
            }

            // Do not keep this if the version is identical
            //  (this is helpful to filter out incrementals before
            //    compareVersions() below)
            if (baseDep.version == envDep.version) {
              return false;
            }

            // Keep this if our environmental dependency is greater than base
            if (compareVersions(envDep.version, baseDep.version) == 1) {
              return true;
            }
            return false;
          }).forEach((dep) => {
            envNeeds[dep] = deps[dep];
            logger.info(`The ${environment} environment also needs ${dep}`);
          });
          this.environmentNeeded[environment] = envNeeds;
        });
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
    const url = `${UrlResolver.artifactForPlugin(plugin)}!META-INF/MANIFEST.MF`;

    return request({
      uri: url,
    }).then((res) => {
      logger.debug(`Fetching ${plugin.artifactId} took ${Date.now() - start}`);
      return res;
    }).catch((err) => logger.error(`Failed to fetch ${url}: ${err}`));
  }
}

module.exports = ManifestResolver;
