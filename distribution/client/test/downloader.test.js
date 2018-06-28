'use strict';

const Downloader = require('../src/lib/downloader');
const mkdirp     = require('mkdirp');

describe('the Downloader class', () => {
  describe('download()', () => {
    let item = 'https://jenkins.io';
    let dir  = '/tmp/jest';

    beforeEach(() => {
      mkdirp.sync(dir);
    });

    it('should return  promise', () => {
      let response = Downloader.download(item, dir);
      expect(Promise.resolve(response)).toBe(response);
    });
  });
});
