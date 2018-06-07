// Initializes the `authentication` service on the path `/authentication`

const createService = require('./authentication.class');
const hooks = require('./authentication.hooks');

module.exports = function(app) {
  const options = {
    name: 'authentication',
    app: app,
    sequelize: app.get('sequelizeClient')
  };

  let service = createService(options);
  app.use('/authentication', service);
  app.service('authentication').hooks(hooks.getHooks());
};
