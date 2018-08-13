jest.mock('fs');

const Downloader = require('../src/lib/downloader');
const mkdirp     = require('mkdirp');
const fs         = require('fs');
const checksum   = require('checksum');

describe('the Downloader class', () => {
  describe('download()', () => {
    let item = 'https://jenkins.io';
    let dir  = '/tmp';

    beforeEach(() => {
      mkdirp.sync(dir);
    });

    it('should return promise', async () => {
      let response = Downloader.download(`${item}/index.html`, dir, 'index.html');
      expect(response instanceof Promise).toBeTruthy();
      await response;

      expect(fs.readFileSync(`${dir}/index.html`)).toBeTruthy();
    });

    it('should fail on url without final basename-ish path', () => {
      expect(() => {
        Promise.resolve(Downloader.download(`${item}/`, dir));
      }
      ).toThrow();
    });

    it('should manage to download a decently big file, retrying if needed', async () => {

      // ace-editor is 5 MB, so it could make tests more flaky and cumbersome with slow connection
      // FIXME: introduce assume() + env var to allow disabling this?
      const toDownload = 'http://updates.jenkins-ci.org/download/plugins/ace-editor/1.1/ace-editor.hpi';
      const expectedSha1 = '39ed0947dcd9b414769ae28b3eb955643e25d5e0';

      jest.setTimeout(50000); // default is 5 seconds, could be bigger because of the file size
      await Downloader.download(toDownload, dir, 'ace-editor.hpi');

      expect(checksum(fs.readFileSync(`${dir}/ace-editor.hpi`))).toBe(expectedSha1);
    });
  });
});
