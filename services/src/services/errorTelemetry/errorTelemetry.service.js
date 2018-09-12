/*
 * The `versions` service is responsible for handling the "audit trail" of
 * Jenkins instance version information.
 *
 * The `version` information for a given instance should be considered append
 * only to the backend data store, and retrieval of the "current" version will
 * simply be taking the last of version records associated with the instance.
 */

const hooks                 = require('./errorTelemetry.hooks');
const ErrorTelemetryService = require('./errorTelemetry.class');

module.exports = function (app) {
  app.use('/telemetry/error', new ErrorTelemetryService(app));
  app.service('telemetry/error').hooks(hooks.getHooks());
};
