const createService = require('feathers-sequelize');
const createModel = require('../../models/tainted');
const hooks = require('./tainted.hooks');

module.exports = function (app) {
  const options = {
    name: 'tainted',
    Model: createModel(app)
  };

  let service = createService(options);
  service.docs = {
    description: 'Mark an update level tainted for a specific instance',
  };
  app.use('/update/tainted', service);
  app.service('/update/tainted').hooks(hooks.getHooks());
};
