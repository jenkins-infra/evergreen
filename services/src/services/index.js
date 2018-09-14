const status = require('./status/status.service');
const registration = require('./registration/registration.service');
const tainted = require('./tainted/tainted.service');

const versions = require('./versions/versions.service.js');

const update = require('./update/update.service.js');

const errorTelemetry = require('./errorTelemetry/errorTelemetry.service.js');

// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(status);
  app.configure(registration);
  app.configure(versions);
  app.configure(update);
  app.configure(errorTelemetry);
  app.configure(tainted);
};
