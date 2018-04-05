// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  /*
   * Add headers onto all our request objects for use by feathers hooks
   *
   * This seems to be required in order to make bearer tokens with
   * @feathersjs/authentication-jwt work
   */
  app.all('*', function(request, response, next) {
    if (request.headers) {
      request.feathers.headers = request.headers;
    }
    next();
  });
};
