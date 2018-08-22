const path    = require('path');
const Storage = require('../src/lib/storage');

describe('The storage module', () => {
  describe('homeDirectory()', () => {
    it('should return a path', () => {
      const home = Storage.homeDirectory();
      // this should look like a path
      expect(path.basename(home)).toBeTruthy();
    });
  });

  describe('jenkinsHome()', () => {
    it('should return a path', () => {
      const home = Storage.jenkinsHome();

      // this should look like a path
      expect(path.basename(home)).toBeTruthy();
      expect(home.startsWith(Storage.homeDirectory())).toBeTruthy();
    });
  });

  describe('pluginsDirectory()', () => {
    it('should return a path', () => {
      const plugins = Storage.pluginsDirectory();

      // this should look like a path
      expect(path.basename(plugins)).toBeTruthy();
      expect(plugins.startsWith(Storage.jenkinsHome())).toBeTruthy();
    });
  });
});
