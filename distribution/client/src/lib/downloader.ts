/*
 * The Downloader is responsible for only downloading of URLs to local files on
 * disk and checking them against provided checksums.
 */

import fs from 'fs';
import path from 'path';
import url from 'url';

import rp from 'promise-request-retry';
import * as logger from 'winston';
import mkdirp from 'mkdirp';

import UI from './ui';
import Checksum from './checksum';
import { RequestOptions } from './request-options';

export default class Downloader {
  constructor() {
  }

  static formatDuration(durationInMs) {
    if (durationInMs < 1000) {
      return `${durationInMs}ms`;
    }
    const seconds = Math.floor(durationInMs / 1000);
    let millisecsPart = '';
    if (seconds < 10) { // keep first digit after comma only for numbers < 10
      // Keep only first digit: 426 => 4, 986=>9
      const millisecs = Math.round( (durationInMs - 1000 * seconds) / 100);
      millisecsPart = `.${millisecs}`;
    }
    return `${seconds}${millisecsPart}s`;
  }

  /*
   * Download the specified URL to the directory as the filename
   *
   * @param {string} the full URL
   * @param {string} a full output directory
   * @param {string} the filename to output at
   * @parma {string} Optional sha256 signature to verify of the file
   */
  static download(item, dir,
    fileNameToWrite?: string,
    sha256?: string,
    downloadOptions: RequestOptions = {}) {
    const itemUrl = url.parse(item);
    const itemUrlBaseName = path.basename(itemUrl.pathname);

    if (!itemUrlBaseName) {
      throw new Error(`The URL must end with a non-empty path. E.g. http://jenkins.io/something.html instead of https://jenkins.io/ (received URL=${itemUrl})`);
    }

    mkdirp.sync(dir);

    const filename = [dir, fileNameToWrite].join(path.sep);

    const retryOption = downloadOptions.retry || 10;
    const delayOption = downloadOptions.delay || 1000;
    const factorOption = downloadOptions.factor || 1.2;

    UI.publish(`Fetching ${filename}`);
    logger.info(`Fetching ${item} and saving to ${filename} (retry=${retryOption}, delay=${delayOption}ms, factor=${factorOption})`);

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
      timeout: 120 * 1000,
      retry: retryOption,
      delay: delayOption,
      factor: factorOption
    };

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      rp(options)
        .then((response) => {
          const elapsedString = Downloader.formatDuration(Date.now() - startTime);
          logger.info ('Download complete for', filename, `(Took ${elapsedString})`);
          UI.publish(`Fetched ${filename} in ${elapsedString}`);

          const output = fs.createWriteStream(filename);

          output.on('close', () => {
            logger.debug('Downloaded %s (%d bytes)', filename, output.bytesWritten);
            if (sha256) {
              logger.debug('Verifying signature for', filename);
              const downloaded = Checksum.signatureFromFile(filename);

              if (sha256 != downloaded) {
                // Our messages are displayed in reverse order in the UI :)
                UI.publish('Jenkins may fail to start properly! Please check your network connection');
                UI.publish(`Signature verification failed for ${filename}! (${downloaded} != ${sha256})`, { log: 'error' });
                return reject(new Error(`Signature verification failed for ${filename}`));
              } else {
                logger.debug(`Correct checksum (${sha256}) for`, filename);
              }
            }
            return resolve(output);
          });
          output.write(response.body);
          output.end();
        })
        .catch((err) => {
          logger.error('Error %s occurred while fetching %s and saving to %s', err, item, filename);
          return reject(err);
        });
    });
  }
}
