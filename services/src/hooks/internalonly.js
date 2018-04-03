/*
 * This hooks only allows internal service calls to the specified service
 * method
 */
const errors = require('@feathersjs/errors');

module.exports = function() {
  return (context) => {
    if (context.type !== 'before') {
      throw new Error('The `internalOnly` hook should only be used as a `before` hook.');
    }
    /* This is an internal call and should be allowed */
    if (!context.params.provider) {
      return context;
    }

    throw new errors.MethodNotAllowed(`The ${context.method} is not allowed on this service`);
  };
};
