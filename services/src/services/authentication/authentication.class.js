/* eslint-disable no-unused-vars */
const logger = require('winston');

/* Stub service class for an Authentication service to map instances in and out of
 * the application
 */
class Authentication {
  constructor (options) {
    this.options = options || {};
  }

  /*
   * Generate a JWT authentication for the requester
   *
   * This method assumes the validation of the information has already happened
   * in a hook
   */
  async create(data, params) {
    const app = this.options.app;
    return await app.passport.createJWT({
      uuid: data.uuid
    }, app.get('authentication'));
  }

  async find(params) {
    logger.info('Authentication.find()', params);
    return {};
  }
}

module.exports = function(options) { return new Authentication(options); };
module.exports.Authentication = Authentication;
