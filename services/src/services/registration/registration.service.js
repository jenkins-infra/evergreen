// Initializes the `registration` service on path `/registration`
const hooks         = require('./registration.hooks');
const createService = require('feathers-sequelize');
const createModel   = require('../../models/registration');

module.exports = function (app) {
  const paginate = app.get('paginate');
  const Model = createModel(app);

  const options = {
    name: 'registration',
    Model,
    paginate
  };

  app.use('/registration', createService(options));
  app.service('registration').hooks(hooks);
};
