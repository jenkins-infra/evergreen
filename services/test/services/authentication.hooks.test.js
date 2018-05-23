const errors = require('@feathersjs/errors');
const hooks  = require('../../src/services/authentication/authentication.hooks');

describe('authentication service hooks', () => {
  describe('validateRequestParameters()', () => {
    it('should throw without a uuid on the request', () => {
      let context = { data: {} };
      expect(() => {
        hooks.validateRequestParameters(context);
      })
        .toThrow(errors.BadRequest);
    });

    it('should throw without a signature on the request', () => {
      let context = { data: { uuid: 'xkcd' }};

      expect(() => {
        hooks.validateRequestParameters(context);
      })
        .toThrow(errors.BadRequest);
    });

    it('should pass with a uuid and signature', () => {
      let context = { data: {
        uuid: 'xkcd',
        signature: 'munroe'
      }};
      expect(hooks.validateRequestParameters(context)).toBe(context);
    });
  });

  describe('validateUUIDRegistered()', () => {
  });

  describe('validateSignature()', () => {
    let record = {
      uuid: 'jest',
      curve: 'secp256k1',
      pubKey: '040539eb5e7e521ef77757dc32044ea5d1864cea9a3ee4ae0547613ce8e4723fe76bf7d809a71b862529f572e9d82b37c81f99868058db241df1a852813077e559',
    };

    it('should throw a BadRequest on an invalid signature', () => {
      let context = {
        data: {
          record: record,
          signature: 'john-hancock'
        }
      };

      expect(() => {
        hooks.validateSignature(context);
      }).toThrow(errors.BadRequest);
    });
  });
});
