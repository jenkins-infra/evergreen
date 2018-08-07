'use strict';

const logger = require('winston');

/*
 * Representation of a plugin dependency defined by a plugin's manifest
 */
 class PluginDependency {
   constructor() {
     this.artifactId = null;
     this.version = null;
     this.optional = false;
   }

   isOptional() { return this.optional; }

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
     dependency.optional = !! line.match(/\=optional/)

     // credentials:2.1.16;resolution:=optional
     const [spec, unused] = line.split(';');
     const [artifactId, version] = spec.split(':');
     dependency.artifactId = artifactId;
     dependency.version = version;
     return dependency;
   }
 }

 module.exports = PluginDependency;
