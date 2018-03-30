// Initializes the `pusher` service on path `/pusher`
const createService = require('./pusher.class.js');
const hooks = require('./pusher.hooks');

module.exports = function (app) {

  const paginate = app.get('paginate');

  const options = {
    name: 'pusher',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/pusher', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('pusher');

  service.hooks(hooks);
};
