const createService = require('./registration.class');
const hooks = require('./registration.hooks');

module.exports = function (app) {
  const paginate = app.get('paginate');

  const options = {
    name: 'registration',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/registration', createService(options));
  // Get our initialized service so that we can register hooks and filters
  const service = app.service('registration');

  service.hooks(hooks);
};
