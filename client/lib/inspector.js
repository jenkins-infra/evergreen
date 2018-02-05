/*
 * The inspector module is responsible for inspecting the state of the Jenkins
 * system underneath.
 *
 */

const crypto = require('crypto');
const fs     = require('fs');
const uuid   = require('uuid');
const unzip  = require('unzip');
const util   = require('util');

/* shamelessly borrowed from
 * https://blog.tompawlak.org/calculate-checksum-hash-nodejs-javascript
 */
function checksum(buffer, algorithm, encoding) {
  return crypto.createHash(algorithm || 'md5')
                .update(buffer, 'utf8')
                .digest(encoding || 'hex');
}

function InspectorError(message) {
  this.message = message;
}
InspectorError.prototype = new Error();


let self = module.exports = {
  InspectorError: InspectorError,

  pathToCore: function() {
    return '/usr/share/jenkins/jenkins.war';
  },

  md5OfCore: function() {
    if (!fs.existsSync(self.pathToCore())) {
      throw new InspectorError('Could not locate the core package for an md5');
    }
    return checksum(fs.readFileSync(self.pathToCore()));
  },

  pathToJenkins: function() {
    return '/var/jenkins_home';
  },

  pathToPlugins: function() {
    return self.pathToJenkins() + '/plugins';
  },

  pluginFiles: function() {
    let plugins = [];

    if (!fs.existsSync(self.pathToPlugins())) {
      return plugins;
    }

    fs.readdirSync(self.pathToPlugins()).forEach(fname => {
      if (fname.match('^.*\.jpi$')) {
        plugins.push(fname);
      }
    });
    return plugins;
  },

  infoFromZip: async function(pluginFile) {
    let pluginPath = [self.pathToPlugins(), pluginFile].join('/');
    let parser = fs.createReadStream(pluginPath).pipe(unzip.Parse());
    let info = {ident: null, version: null};

    parser.on('entry', function(entry) {
      if (entry.path == 'META-INF/MANIFEST.MF') {
        entry.on('data', (chunk) => {
          let manifest = chunk.toString();
          info.version = manifest.match('Plugin-Version: (.*)\r\n')[1];
          info.ident = manifest.match('Extension-Name: (.*)\r\n')[1];
        });
      }
      else {
        entry.autodrain();
      }
    });

    let waiter = new Promise(function(resolve, reject) {
      parser.on('close', () => { resolve() });
      parser.on('end', () => { resolve() });
      parser.on('error', () => { reject() });
    });

    await waiter;
    return info;
  },

  /*
   * Return an md5 hash of the identity.key.enc file, we don't actually need
   * the identity itself, we just need some unique hash to identify this
   * instance in our request
   */
  identity: function() {
    let identFile = util.format('%s/identity.key.enc', self.pathToJenkins());
    if (!fs.existsSync(identFile)) {
      console.warn('Could not locate an identity.key.enc file to use as an identity');
      return uuid.v1();
    }
    return checksum(fs.readFileSync(identFile));
  }
};
