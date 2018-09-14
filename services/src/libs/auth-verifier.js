const ecc          = require('elliptic');
const logger       = require('winston');
const { Verifier } = require('@feathersjs/authentication-local');

/*
 * AuthVerifier is a custom Verifier class for the FeathersJS authentication
 * support
 *
 * Since Feathers already has the machinery to look up entities in our
 * registration, all this Verifier must do is validate the signature matching
 * the entityt
 */
class AuthVerifier extends Verifier {
  /*
   * For compatibility, the 'signature' parameter is expected to be a JSON
   * encoded signature object
   */
  _comparePassword(entity, signature) {
    const ec = new ecc.ec(entity.curve);
    const key = ec.keyFromPublic(entity.pubKey, 'hex');

    try {
      if (!key.verify(entity.uuid, JSON.parse(signature))) {
        return Promise.reject(false);
      }
    } catch (err) {
      logger.error('Improperly formed signature sent', err.message);
      return Promise.reject(err);
    }
    return Promise.resolve(entity);
  }
}

module.exports = AuthVerifier;
