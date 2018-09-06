/*
 * This test suite covers the interactions between the `versions` and the
 * `update` service for generating the appropriate update manifest for a
 * client.
 */

const fs   = require('fs');

const request = require('request-promise');
const h       = require('./helpers');

describe('versions/updates interaction acceptance tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

  beforeEach(async () => {
    /*
     * We always want to make sure we have a properly seeded database with the
     * latest from ingest.yaml for each test.
     */
    this.ingest = JSON.parse(fs.readFileSync('./ingest.json'));
    this.settings = JSON.parse(fs.readFileSync(`./config/${process.env.NODE_ENV}.json`));

    return request({
      url: h.getUrl('/update'),
      method: 'POST',
      headers: { 'Authorization': this.settings.internalAPI.secret },
      json: true,
      body: {
        commit: Date.now().toString(),
        manifest: this.ingest,
      },
    });
  });

  describe('with a docker-cloud flavored client', () => {
    beforeEach(async () => {
      let { token, uuid } = await h.registerAndAuthenticate();
      this.token = token;
      this.uuid = uuid;

      /*
      * Once we have registered, we need to send a status in order for updates
      * to properly be loaded.
      */
      await request({
        url: h.getUrl('/status'),
        method: 'POST',
        headers: { 'Authorization': this.token },
        json: true,
        body: {
          uuid: this.uuid,
          flavor: 'docker-cloud'
        }
      });
    });

    describe('fetching updates for a fresh client', () => {
      beforeEach(async () => {
        this.response = await request({
          url: h.getUrl(`/update/${this.uuid}`),
          headers: { 'Authorization': this.token },
          json: true
        });
      });

      it('should be in the `general` channel', () => {
        expect(this.response).toHaveProperty('meta.channel', 'general');
      });

      it('should have a core url', () => {
        expect(this.response).toHaveProperty('core.url');
      });

      it('should have plugins', () => {
        expect(this.response).toHaveProperty('plugins.updates');
        expect(this.response.plugins.updates.length).toBeGreaterThan(0);
      });

      it('should include the docker-plugin', () => {
        expect(this.response).toHaveProperty('plugins.updates');
        let foundPlugin = false;
        this.response.plugins.updates.forEach((plugin) => {
          if (plugin.url.match(/docker-plugin/)) {
            foundPlugin = true;
          }
        });
        expect(foundPlugin).toBeTruthy();
      });

      describe('a follow-up request for updates', () => {
        it('should receive a 304 Not Modified response', () => {
          return request({
            url: h.getUrl(`/update/${this.uuid}`),
            headers: { 'Authorization': this.token },
            qs: {
              level: this.response.meta.level,
            },
            json: true
          })
            .then(r => expect(r).toBeFalsy())
            .catch(err => expect(err.statusCode).toBe(304));
        });
      });
    });


    describe('fetch updates for a client with empty `versions` records', () => {
      beforeEach(async () => {
        const versions = {
          schema: 1,
          container: {},
          client: {},
          jenkins: {
            core: null,
            plugins: {},
          },
        };

        await request({
          url: h.getUrl('/versions'),
          method: 'POST',
          headers: { 'Authorization': this.token },
          json: true,
          body: {
            uuid: this.uuid,
            manifest: versions
          }
        });

        this.response = await request({
          url: h.getUrl(`/update/${this.uuid}`),
          headers: { 'Authorization': this.token },
          json: true
        });
      });

      it('should be given that core version as an update', () => {
        expect(this.response).toBeTruthy();
        expect(this.response).toHaveProperty('core.url');
      });

      it('should have plugins', () => {
        expect(this.response).toHaveProperty('plugins.updates');
        expect(this.response.plugins.updates.length).toBeGreaterThan(0);
      });

      it('should include the docker-plugin', () => {
        expect(this.response).toHaveProperty('plugins.updates');
        let foundPlugin = false;
        this.response.plugins.updates.forEach((plugin) => {
          if (plugin.url.match(/docker-plugin/)) {
            foundPlugin = true;
          }
        });
        expect(foundPlugin).toBeTruthy();
      });
    });

    describe('fetching updates for a client with filled out `versions` records', () => {
      beforeEach(async () => {
        /*
        * First we need to publish a versions
        */
        let pluginManifest = this.ingest.plugins[0];
        this.pluginName = pluginManifest.artifactId;
        this.invalidPluginName = 'no-longer-valid';

        let versions = {
          schema: 1,
          container: {},
          client: {},
          jenkins: {
            core: this.ingest.core.checksum.signature,
            plugins: {},
          },
        };
        versions.jenkins.plugins[this.pluginName] = pluginManifest.checksum.signature;
        versions.jenkins.plugins[this.invalidPluginName] = 'random_checksum';

        await request({
          url: h.getUrl('/versions'),
          method: 'POST',
          headers: { 'Authorization': this.token },
          json: true,
          body: {
            uuid: this.uuid,
            manifest: versions
          }
        });
        this.response = await request({
          url: h.getUrl(`/update/${this.uuid}`),
          headers: { 'Authorization': this.token },
          json: true
        });
      });

      it('should not be given that core version as an update', () => {
        expect(this.response).toBeTruthy();
        expect(this.response).toHaveProperty('core', {});
      });

      it('should not be given a plugin it already has', () => {
        expect(this.response).toBeTruthy();
        expect(this.response).toHaveProperty('plugins.updates');

        let found = false;
        this.response.plugins.updates.forEach((plugin) => {
          if (plugin.artifactId == this.pluginName) {
            found = true;
          }
        });
        expect(found).not.toBeTruthy();
      });

      it('should be given no longer used plugins in deletes', () => {
        expect(this.response).toBeTruthy();
        expect(this.response).toHaveProperty('plugins.deletes');
        expect(this.response.plugins.deletes).toHaveLength(1);
        expect(this.response.plugins.deletes).toEqual(expect.arrayContaining([this.invalidPluginName]));
      });
    });
  });
});
