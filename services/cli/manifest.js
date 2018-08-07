'use strict';

const fs     = require('fs');
const logger = require('winston');
const yaml   = require('js-yaml');

const DEFAULT_FILENAME = './essentials.yaml'

/*
 * Wrapper for the essentials.yaml
 */
 class Manifest {
   constructor(data, fileName) {
     this.data = data;
     this.fileName = fileName;
   }

   /*
    * Read an essentials.yaml and build a Manifest object
    *
    * @param {string} optional path to an essentials.yaml file
    * @return {Manifest}
    */
   static loadFile(fileName) {
     if (!fileName) {
       fileName = DEFAULT_FILENAME;
    }
    return new Manifest(
      yaml.safeLoad(fs.readFileSync(fileName)),
      fileName
    );
   }

   getPlugins() {
     return this.data.spec.plugins;
   }

   getEnvironments() {
   }

   getRealizedPlugins() {
   }
 }

 module.exports = Manifest;
