/* eslint-disable no-unused-vars */

/* Needed for generating client registration UUIDs */
const uuid   = require('uuid/v4');
const logger = require('winston');

class Service {
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
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
