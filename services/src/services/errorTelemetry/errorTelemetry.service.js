/*
 * The `versions` service is responsible for handling the "audit trail" of
 * Jenkins instance version information.
 *
 * The `version` information for a given instance should be considered append
 * only to the backend data store, and retrieval of the "current" version will
 * simply be taking the last of version records associated with the instance.
 */

const hooks = require('./errorTelemetry.hooks');

module.exports = function (app) {
  class MyService {
    constructor() {
    }
    create(data) {
      if(!data) {
        return Promise.reject({status:'KO'});
      }
      // TODO: store the data passed in /somewhere/.
      return Promise.resolve({status:'OK'});
      // Called
    }
  }

  app.use('/telemetry/error', new MyService());
  app.service('telemetry/error').hooks(hooks.getHooks());
};
