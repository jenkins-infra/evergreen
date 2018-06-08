const errors             = require('@feathersjs/errors');
const ensureMatchingUUID = require('../../src/hooks/ensureuuid');

describe('ensureuuid hook', () => {
  beforeEach(() => {
    this.context = {
      params: {
        provider: 'rest',
        payload: {},
        query: {},
      },
      data: {},
    };
  });

  it('should fail if the request does not include a UUID', () => {
    expect(() => {
      ensureMatchingUUID(this.context);
    }).toThrow(errors.BadRequest);
  });

  it('should fail if the JWT uuid and the given UUID are identical', () => {
    this.context.data.uuid = 'who i want to be';
    this.context.params.payload = { uuid: 'who i be' };
    expect(() => {
      ensureMatchingUUID(this.context);
    }).toThrow(errors.NotAuthenticated);
  });

  describe('for internal service calls', () => {
    beforeEach(() => {
      delete this.context.params.provider;
    });

    it('should return successfully', () => {
      expect(ensureMatchingUUID(this.context));
    });
  });

  describe('for GET methods which use query parameters', () => {
    beforeEach(() => {
      this.context.method = 'get';
    });

    it('should fail with an omitted query parameter', () => {
      expect(() => {
        ensureMatchingUUID(this.context);
      }).toThrow(errors.BadRequest);
    });

    it('should allow the request with a matching `uuid` query param', () => {
      let uuid = 'jest-uuid';
      /* This is the property name that JWT would extract to */
      this.context.params.payload.uuid = uuid;
      this.context.params.query = { uuid: uuid };

      expect(ensureMatchingUUID(this.context));
    });

    it('should fail without matching token and query param `uuid`s', () => {
      let uuid = 'jest-uuid';
      /* This is the property name that JWT would extract to */
      this.context.params.payload.uuid = uuid;
      this.context.params.query = { uuid: 'pickles', };

      expect(() => {
        expect(ensureMatchingUUID(this.context));
      }).toThrow(errors.NotAuthenticated);
    });
  });
});
