const AuthVerifier = require('../../src/libs/auth-verifier');
const { Verifier } = require('@feathersjs/authentication-local');

describe('Auth Verifier', () => {
  const options = {
    // Make server a no-op to allow construction
    service: true,
  };
  it('should be insance of a verifier', () => {
    expect((new AuthVerifier(null, options))).toBeInstanceOf(Verifier);
  });

  describe('_comparePassword()', () => {
    const entity = {
      uuid: 'jest-uuid',
      curve: 'secp256k1',
      pubkey: 'bogus',
    };

    beforeEach(() => {
      this.verifier = new AuthVerifier(null, options);
    });

    it('should reject if the password (signed uuid) is bad', () => {
      const signature = JSON.stringify({
        r: 'bad',
        s: 'signature',
      });
      return expect(this.verifier._comparePassword(entity, signature)).rejects.toBeInstanceOf(Error);
    });
  });
});
