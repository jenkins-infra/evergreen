// Initializes the `versions` service on path `/versions`
const createService = require('feathers-sequelize');
const createModel = require('../../models/version');
const hooks = require('./versions.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'versions',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/versions', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('versions');

  service.hooks(hooks);
};
