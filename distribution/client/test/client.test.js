const assert = require('assert');
const tmp      = require('tmp');
const Client = require('../src/client');
const Storage  = require('../src/lib/storage');
const mkdirp   = require('mkdirp');

describe('The base client module', () => {

  it('should interpret properly', () => {
    assert(Client);
  });

  describe('flavorCheck', () => {
    beforeEach( () => {
      const evergreenHome = tmp.dirSync({unsafeCleanup: true}).name;
      Storage.homeDirectory = (() => evergreenHome );
      mkdirp.sync(Storage.jenkinsHome());
    });

    it('should throw an error with no flavor defined', () => {
      expect(() => {
        delete process.env.FLAVOR;
        new Client();
      }).toThrow();
    });
  });

  describe('isOffline()', () => {
    let client = null;

    beforeEach( () => {
      const evergreenHome = tmp.dirSync({unsafeCleanup: true}).name;
      Storage.homeDirectory = (() => evergreenHome );
      mkdirp.sync(Storage.jenkinsHome());
      process.env.FLAVOR = 'docker-cloud';
      client = new Client();
    });


    it('should default to false', () => {
      expect(client.isOffline()).toBeFalsy();
    });

    describe('when EVERGREEN_OFFLINE is set', () => {
      beforeEach(() => {
        jest.resetModules();
        process.env.EVERGREEN_OFFLINE = '1';
      });

      afterEach(() => {
        jest.resetModules();
      });

      it('should be true', () => {
        expect(client.isOffline()).toBeTruthy();
      });
    });
  });
});
