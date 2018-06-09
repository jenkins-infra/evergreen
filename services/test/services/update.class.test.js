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

});
