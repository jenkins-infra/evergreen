// Initializes the `status` service on path `/status`
const createService = require('feathers-sequelize');
const hooks         = require('./status.hooks');

module.exports = function (app) {
  const options = {
    id: 'uuid',
    /* We need to set raw to false here otherwise feathers-sequelize assumes
     * that raw should be turned to true, which changes the output of the
     * associations from nested JSON objections, to association.value=
     * attributes on the root of the JSON object
     */
    raw: false,
    Model: app.get('models').instance
  };

  let service = createService(options);
  service.events = ['ping'];
  service.docs = {
    description: 'Manage and retrieve Update Levels for Evergreen clients',
    create: {
      description: 'Create a new Update Level based off an ingest.yaml',
    },
  };
  app.use('/status', service);

  /* Since status.hooks is putting moer than just before/after/error onto
   * module.exports, we need to make sure that we're not pushing things which
   * feathersjs doesn't consider hooks into the hooks registration
   */

  app.service('status').hooks(hooks.getHooks());
};
