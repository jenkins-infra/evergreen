const instance = require('./instance/instance.service');
const status = require('./status/status.service');
const pusher = require('./pusher/pusher.service');
const registration = require('./registration/registration.service');

// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(instance);
  app.configure(status);
  app.configure(pusher);
  app.configure(registration);
};
