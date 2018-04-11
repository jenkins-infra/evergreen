const auth = require('./authentication/authentication.service');
const status = require('./status/status.service');
const pusher = require('./pusher/pusher.service');
const registration = require('./registration/registration.service');

const versions = require('./versions/versions.service.js');

// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(auth);
  app.configure(status);
  app.configure(pusher);
  app.configure(registration);
  app.configure(versions);
};
