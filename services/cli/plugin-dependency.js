'use strict';

/*
 * Representation of a plugin dependency defined by a plugin's manifest
 */
 class PluginDependency {
   constructor() {
     this.optional = false;
   }

   isOptional() { return this.optional; }

   /*
    * Return the object based on an entry in MANIFEST.MF's Plugin-Dependencies
    * metadata
    *
    * @param {string} Entry from the comma separated list
    * @return {PluginDependency}
    */
   static fromEntry(line) {
     let dependency = new PluginDependency();
     dependency.optional = entry.match(/\=optional/)
     [dependency.name, dependency.version] = line.split(':');
     return dependency;
   }
 }

 module.exports = PluginDependency;
