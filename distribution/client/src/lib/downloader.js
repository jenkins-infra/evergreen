/*
 * The Downloader is responsible for only downloading of URLs to local files on
 * disk and checking them against provided checksums.
 */

const fs     = require('fs');
const path   = require('path');
const url    = require('url');

const rp      = require('promise-request-retry');
const logger  = require('winston');
const mkdirp  = require('mkdirp');

class Downloader {
  constructor() {
  }

  static download(item, dir) {
    const itemUrl = url.parse(item);
    const itemUrlBaseName = path.basename(itemUrl.pathname);
    if (!itemUrlBaseName) {
      throw new Error(`The URL must end with a non-empty path. E.g. http://jenkins.io/something.html instead of https://jenkins.io/ (received URL=${itemUrl})`);
    }

    mkdirp.sync(dir);
    const filename = [dir, itemUrlBaseName].join(path.sep);

    logger.info('Fetching %s and saving to %s', item, filename);

    let options = {
      uri: item,
      verboseLogging: true,
      method: 'GET',
      headers: {
        'User-Agent': 'evergreen-client'
      },
      simple: true,
      resolveWithFullResponse: true,
      encoding: null,
      timeout: 10 * 1000,
      retry: 3 // make it configurable?
    };

    return new Promise( (resolve, reject) => {
      rp(options)
        .then( (response) => {

          const output = fs.createWriteStream(filename);

          output.on('close', () => {
            logger.debug('Downloaded %s (%d bytes)',
              filename, output.bytesWritten);
            resolve(output);
          });
          output.write(response.body);
          output.end();
        })
        .catch((err) => {
          logger.error('Error %s occurred while fetching %s and saving to %s', err, item, filename);
          reject(err);
        });
    });
  }
}

module.exports = Downloader;
