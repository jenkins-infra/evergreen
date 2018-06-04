const errors = require('@feathersjs/errors');
const logger = require('winston');

/*
 * Ensure that the given UUID matches the UUID inside of the JWT
 *
 * DOES NOT APPLY TO INTERNAL CALLS
 */
module.exports = function(context) {

  /* This is an internal call and should be allowed */
  if (!context.params.provider) {
    return context;
  }

  /*
   * If we have no UUID provided by the JWT, bail early
   */
  if (!context.params.payload) {
    throw new errors.BadRequest('Missing token with request');
  }

  if ((context.method == 'get') || (context.method == 'find')) {
    if (!context.params.query.uuid) {
      throw new errors.BadRequest('Invalid UUID in query parameters');
    }
    // if (context.data.uuid != context.params.query.uuid) {
    //   throw new errors.NotAuthenticated('Invalid UUID');
    // }
  }
  else {
    if (!context.data.uuid) {
      throw new errors.BadRequest('Invalid UUID in data body');
    }

    if (context.data.uuid != context.params.payload.uuid) {
      logger.error('Receiving a request with a UUID not matching the token (%s/%s)',
        context.data.uuid,
        context.params.payload.uuid);
      throw new errors.NotAuthenticated('Invalid UUID');
    }
  }

  return context;
};
