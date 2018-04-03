/* eslint-disable no-unused-vars */
const logger = require('winston');

/* Stub service class for an Instance service to map instances in and out of
 * the application
 */
class Instance {
  constructor (options) {
    this.options = options || {};
  }

  async create(data, params) {
    logger.info('Instance.create()', data, params);
  }

  async find(params) {
    logger.info('Instance.find()', params);
    return {};
  }
}

module.exports = function(options) { return new Instance(options); };
module.exports.Instance = Instance;
