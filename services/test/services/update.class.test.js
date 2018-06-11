const app           = require('../../src/app');
const createService = require('../../src/services/update/update.class');
const createModel   = require('../../src/models/update');

describe('update service class', () => {
  describe('scopeFindQuery()', () => {
    beforeEach(() => {
      let options = {
        name: 'update',
        Model: createModel(app),
      };
      this.service = createService(options);
    });

    it('should default the channel', () => {
      let params = {};
      this.service.scopeFindQuery(params);
      expect(params.query.channel).toBe('general');
    });

    it('should sort by most recent when there is no pre-defined level', () => {
      let params = {};
      this.service.scopeFindQuery(params);
      expect(params.query.$sort.createdAt).toBe(-1);
    });

    it('should use the channel provided by the request', () => {
      let params = {};
      params.query = { channel: 'beta' };
      this.service.scopeFindQuery(params);
      expect(params.query.channel).toBe('beta');
    });

    it('should use the request-provided level and sort from there', () => {
      let params = {};
      params.query = { level: 5 };
      this.service.scopeFindQuery(params);

      let query = params.query;
      expect(query.$sort.createdAt).toBe(1);
      expect(query.id.$gt).toBe(5);
    });
  });

  describe('prepareManifestFromRecord()', () => {
    let computed = {
      plugins: {
        updates: [],
      },
    };
    it('should handle an empty record properly', () => {
      expect(this.service.prepareManifestFromRecord({}, computed)).toBe(computed);
    });

    it('should populate the manifest', () => {
      let plugin = { url: 'http://jest.io', checksum: {} };
      let record = {
        manifest: {
          plugins: [plugin]
        },
      };

      expect(this.service.prepareManifestFromRecord(record, computed)).toBe(computed);

      expect(computed).toHaveProperty('plugins.updates', [plugin]);
    });
  });

  describe('prepareManifestWithFlavor()', () => {
    let computed = {
      plugins: {
        updates: [],
      },
    };

    // how bland!
    it('should do nothing if the instance has no flavor', () => {
      expect(this.service.prepareManifestWithFlavor({}, {}, computed)).toBe(computed);
    });

    it('should populate the manifest with the flavor\'s additions', () => {
      let plugin = { url: 'http://jest.io', checksum: {} };
      let instance = { flavor : 'docker-cloud' };
      let record = {
        manifest: {
          environments: {
            'docker-cloud': {
              plugins: [plugin]
            },
          }
        }
      };

      let result = this.service.prepareManifestWithFlavor(instance, record, computed);
      expect(result).toBe(computed);
      expect(result).toHaveProperty('plugins.updates', [plugin]);
    });
  });
});
