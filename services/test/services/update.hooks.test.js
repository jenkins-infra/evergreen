const hooks  = require('../../src/services/update/update.hooks');
const errors = require('@feathersjs/errors');

describe('update service hooks', () => {
  describe('scopeFindQuery()', () => {
    let context = {
      params: {},
    };

    it('should default the channel', () => {
      hooks.scopeFindQuery(context);
      expect(context.params.query.channel).toBe('general');
    });

    it('should sort by most recent when there is no pre-defined level', () => {
      hooks.scopeFindQuery(context);
      expect(context.params.query.$sort.createdAt).toBe(-1);
    });

    it('should use the channel provided by the request', () => {
      context.params.query = { channel: 'beta' };
      hooks.scopeFindQuery(context);
      expect(context.params.query.channel).toBe('beta');
    });

    it('should use the request-provided level and sort from there', () => {
      context.params.query = { level: 5 };
      hooks.scopeFindQuery(context);

      let query = context.params.query;
      expect(query.$sort.createdAt).toBe(1);
      expect(query.id.$gt).toBe(5);
    });
  });

  describe('defaultChannel()', () => {
    let context = {
      params: {},
      data: {},
    };

    it('should add the default `channel` to the context.data', () => {
      expect(hooks.defaultChannel(context)).toBe(context);
      expect(context.data.channel).toBe('general');
    });
  });

  describe('prepareIngestManifest()', () => {
    let context = {
      params: {},
      data: {},
    };

    it('should reject empty bodies', () => {
      expect(() => {
        hooks.prepareIngestManifest(context);
      }).toThrow(errors.BadRequest);
    });

    describe('with a proper ingest manifest', () => {
      let manifest = {
        timestamp: '2018-05-21T21:40:17+00:00',
        core: {
          url: 'http://mirrors.jenkins.io/war/latest/jenkins.war',
          checksum: {
            type: 'sha256',
            signature: '246c298e9f9158f21b931e9781555ae83fcd7a46e509522e3770b9d5bdc88628'
          },
        },
        plugins: [
        ],
        environments: {
        },
      };

      it('should convert the context.data to a model representation', () => {
        context.data = manifest;
        expect(hooks.prepareIngestManifest(context)).toBe(context);
        expect(context.data.manifest).toBe(manifest);
      });
    });
  });
});
