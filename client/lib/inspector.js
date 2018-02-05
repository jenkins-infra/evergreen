/*
 * The inspector module is responsible for inspecting the state of the Jenkins
 * system underneath.
 *
 */

const crypto = require('crypto');
const fs     = require('fs');
const unzip  = require('unzip');

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

  pathToPlugins: function() {
    return '/var/jenkins_home/plugins';
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
  }
};
