/*
 * Validate the internalapi hook properly guards against unauthenticated
 * requests
 */
const errors = require('@feathersjs/errors');
const hook   = require('../../src/hooks/internalapi');

describe('the `internalApi` hook', () => {
  let context = {
    params: {
      headers: {},
    },
    app: {
      get: () => {
        // Stubbed to only return the `internalAPI` key
        return {
          secret: 'a secret',
        };
      },
    },
  };

  describe('without an Authorization header', () => {
    it('should throw NotAuthorized', () => {
      expect(() => {
        hook(context);
      }).toThrow(errors.NotAuthenticated);
    });
  });

  describe('with an Authorization header', () => {
    beforeEach(() => {
      context.params.headers = {
        authorization: 'a secret',
      };
    });

    it('should pass-through if the header is valid', () => {
      expect(hook(context)).toBe(context);
    });

    it('should throw NotAuthorized if the header is invalid', () => {
      context.params.headers.authorization = 'the wrong word!';
      expect(() => {
        hook(context);
      }).toThrow(errors.NotAuthenticated);
    });
  });
});
