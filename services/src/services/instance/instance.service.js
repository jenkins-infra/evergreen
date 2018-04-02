// Initializes the `instance` service on the path `/instance`

const createInstance = require('./instance.class');
const hooks = require('./instance.hooks');

module.exports = function(app) {
  const options = {
    name: 'instance',
    sequelize: app.get('sequelizeClient')
  };

  app.use('/instance', createInstance(options));

  app.service('instance').hooks(hooks);
};
