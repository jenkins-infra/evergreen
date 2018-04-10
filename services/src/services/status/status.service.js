// Initializes the `status` service on path `/status`
const createService = require('feathers-sequelize');
const hooks         = require('./status.hooks');

module.exports = function (app) {
  const Model = app.get('models').instance;
  const paginate = app.get('paginate');

  const options = {
    name: 'status',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/status', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('status');

  service.hooks(hooks);
};
