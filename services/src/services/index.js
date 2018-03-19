const status = require('./status/status.service.js');
const pusher = require('./pusher/pusher.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(status);
  app.configure(pusher);
};
