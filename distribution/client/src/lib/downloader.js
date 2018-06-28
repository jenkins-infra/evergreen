/*
 * The Downloader is responsible for only downloading of URLs to local files on
 * disk and checking them against provided checksums.
 */

const fs     = require('fs');
const path   = require('path');
const url    = require('url');

const fetch   = require('node-fetch');
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

    return new Promise((resolve, reject) => {
      fetch(item).then((res) => {
        const output = fs.createWriteStream(filename);

        output.on('close', () => {
          logger.debug('Downloaded %s (%d bytes)',
            filename, output.bytesWritten);
          resolve(output);
        });

        output.on('error', err => reject(err));

        res.body.pipe(output);
      });
    });
  }
}

module.exports = Downloader;
