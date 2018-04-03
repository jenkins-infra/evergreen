/* eslint-disable no-unused-vars */
const logger = require('winston');

/* Stub service class for an Authentication service to map instances in and out of
 * the application
 */
class Authentication {
  constructor (options) {
    this.options = options || {};
  }

  async create(data, params) {
    logger.info('Authentication.create()', data, params);
  }

  async find(params) {
    logger.info('Authentication.find()', params);
    return {};
  }
}

module.exports = function(options) { return new Authentication(options); };
module.exports.Authentication = Authentication;
