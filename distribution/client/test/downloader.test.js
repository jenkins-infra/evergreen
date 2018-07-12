jest.mock('fs');

const Downloader = require('../src/lib/downloader');
const mkdirp     = require('mkdirp');

describe('the Downloader class', () => {
  describe('download()', () => {
    let item = 'https://jenkins.io';
    let dir  = '/tmp';

    beforeEach(() => {
      mkdirp.sync(dir);
    });

    it('should return promise', () => {
      let response = Downloader.download(`${item}/index.html`, dir);
      expect(Promise.resolve(response)).toBe(response);
    });

    it('should fail on url without final basename-ish path', () => {
      expect(() => {
        Promise.resolve(Downloader.download(`${item}/`, dir));
      }
      ).toThrow();
    });
  });
});
