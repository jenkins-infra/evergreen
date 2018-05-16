/*
 * This module contains some simple and basic express middleware for running
 * the Evergreen backend service layer.
 *
 * If any of these become more than a few lines, they should be moved into
 * their own modules and properly unit tested
 */

module.exports = function (app) {
  /*
   * Add headers onto all our request objects for use by feathers hooks
   *
   * This seems to be required in order to make bearer tokens with
   * @feathersjs/authentication-jwt work
   */
  app.all('*', (request, response, next) => {
    if (request.headers) {
      request.feathers.headers = request.headers;
    }
    next();
  });

  /*
   * Remove redundant slashes in the URL for properly routing
   *
   * For example: //authentication -> /authentication which ensures that the
   * request is routed correctly
   */
  app.all('*', (request, response, next) => {
    request.url = request.url.replace(/\/+/, '/');
    next();
  });
};
