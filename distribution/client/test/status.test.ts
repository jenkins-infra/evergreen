'use strict';

jest.mock('fs');

const fs       = require('fs');
const mkdirp   = require('mkdirp');
const feathers = require('@feathersjs/feathers');

import Status from '../src/lib/status';

describe('The status module', () => {
  beforeEach(() => {
    /* Make sure memfs is flushed every time */
    fs.volume.reset();
  });

  let app = feathers();

  it('should be constructable', () => {
    expect((new Status(app))).toBeTruthy();
  });

  describe('getTimezone()', () => {
    it('should return the client timezone', () => {
      const tz = (new Status(app)).getTimezone();
      expect(tz).toBeTruthy();
    });
  });

  describe('create()', () => {
    const create = jest.fn();
    const mockApp = {
      service: () => {
        return {
          create: create,
        };
      }
    };
    it('should invoke the create api', async () => {
      create.mockResolvedValue('response');
      const status = new Status(mockApp);
      const response = await status.create();
      expect(response).toBeTruthy();
    });
  });

  describe('authenticate()', () => {
    const s = new Status(app);

    it('should store the token', () => {
      const token = 'sekret';
      const uuid = 'ohai';
      s.authenticate(uuid, token);
      expect(s.uuid).toEqual(uuid);
      expect(s.token).toEqual(token);
    });
  });

  describe('collectVersions()', () => {
    it('should contain a node version', () => {
      const versions : any = (new Status(app)).collectVersions();
      expect(versions.container.tools.node).toBeTruthy();
    });

    describe('when there is a jenkins.war present', () => {
      beforeEach(() => {
        mkdirp.sync('/evergreen/data/jenkins/home');
        fs.writeFileSync('/evergreen/data/jenkins/home/jenkins.war', 'jest!');
      });

      it('should contain the core signature', () => {
        const versions = (new Status(app)).collectVersions();
        expect(versions.jenkins.core).toBeTruthy();
      });
    });

    describe('When there are plugins present', () => {
      beforeEach(() => {
        mkdirp.sync('/evergreen/data/jenkins/home/plugins');
        fs.writeFileSync('/evergreen/data/jenkins/home/plugins/git.jpi', 'jest!');
        // important check: should never happen, but if someone put a .hpi by hand
        // we should be aware, since Jenkins *will* load it
        fs.writeFileSync('/evergreen/data/jenkins/home/plugins/bla.hpi', 'jest again!');
      });

      it('should contain the signature of the plugin', () => {
        const versions : any = (new Status(app)).collectVersions();
        expect(versions.jenkins.plugins.bla).toBeTruthy();
        expect(versions.jenkins.plugins.git).toBeTruthy();
      });
    });

    describe('when a commit.txt is present', () => {
      beforeEach(() => {
        fs.writeFileSync('/commit.txt', 'jest');
      });
      it('should contain the sha1 from the file', () => {
        const versions = (new Status(app)).collectVersions();
        expect(versions.container.commit).toEqual('jest');
      });
    });
  });
});
