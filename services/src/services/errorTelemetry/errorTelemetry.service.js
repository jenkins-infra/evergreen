/*
 * The `versions` service is responsible for handling the "audit trail" of
 * Jenkins instance version information.
 *
 * The `version` information for a given instance should be considered append
 * only to the backend data store, and retrieval of the "current" version will
 * simply be taking the last of version records associated with the instance.
 */

const fs    = require('fs');

const hooks = require('./errorTelemetry.hooks');

module.exports = function (app) {
  class MyService {
    constructor() {
    }
    create(data) {
      // Should be impossible because it passed the hooks step
      if(!data) {
        return Promise.reject({status:'KO'});
      }

      // FIXME: TBD where, what and how to actually send data
      const toWrite = `${new Date()} => ${JSON.stringify(data)}\n\n`;
      fs.appendFileSync('/tmp/blah', toWrite);

      return Promise.resolve({status:'OK'});
    }

  }

  app.use('/telemetry/error', new MyService());
  app.service('telemetry/error').hooks(hooks.getHooks());
};
