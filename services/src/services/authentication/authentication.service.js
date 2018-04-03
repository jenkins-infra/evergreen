// Initializes the `authentication` service on the path `/authentication`

const createAuth = require('./authentication.class');
const hooks = require('./authentication.hooks');

module.exports = function(app) {
  const options = {
    name: 'authentication',
    sequelize: app.get('sequelizeClient')
  };

  app.use('/authentication', createAuth(options));

  app.service('authentication').hooks(hooks);
};
