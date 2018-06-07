// Initializes the `update` service on path `/update`
const createService = require('feathers-sequelize');
const createModel = require('../../models/update');
const hooks = require('./update.hooks');

module.exports = function (app) {
  const Model = createModel(app);

  const options = {
    name: 'update',
    Model,
  };

  // Initialize our service with any options it requires
  let service = createService(options);
  service.docs = {
    description: 'Manage and retrieve Update Levels for Evergreen clients',
    create: {
      description: 'Create a new Update Level based off an ingest.yaml',
    },
  };
  app.use('/update', service);
  app.service('update').hooks(hooks.getHooks());
};
