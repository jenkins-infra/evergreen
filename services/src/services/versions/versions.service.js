/*
 * The `versions` service is responsible for handling the "audit trail" of
 * Jenkins instance version information.
 *
 * The `version` information for a given instance should be considered append
 * only to the backend data store, and retrieval of the "current" version will
 * simply be taking the last of version records associated with the instance.
 */

const createService = require('feathers-sequelize');
const createModel = require('../../models/version');
const hooks = require('./versions.hooks');

module.exports = function (app) {
  const options = {
    name: 'versions',
    Model: createModel(app)
  };

  app.use('/versions', createService(options));
  app.service('versions').hooks(hooks);
};
