/* eslint-disable no-unused-vars */

/* Needed for generating client registration UUIDs */
const uuid   = require('uuid/v4');
const logger = require('winston');

class Registration {
  constructor (options) {
    this.options = options || {};
  }

  async create (data, params) {
    if (Array.isArray(data)) {
      return await Promise.all(data.map(current => this.create(current)));
    }

    /* TODO: Persist to the database, duh */
    Object.assign(data, {
      uuid: uuid()
    });

    return data;
  }

  /* Find the Registration record and return it
   *
   * This method is expected to only be called internally and not exposed
   * publicly, and shoulid be blocked by a before hook in registration.hooks.js
   *
   * @return Array
   */
  async find (params) {
    return Promise.resolve([]);
  }
}


module.exports = function (options) {
  return new Registration(options);
};

module.exports.Registration = Registration;
