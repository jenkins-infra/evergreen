// Initializes the `status` service on path `/status`
const createStatus = require('./status.class');
const hooks        = require('./status.hooks');

module.exports = function (app) {
  const options = {
    name: 'status',
    models: app.get('models'),
    sequelize: app.get('sequelizeClient')
  };

  app.use('/status', createStatus(options));
  app.service('status').hooks(hooks);
};
