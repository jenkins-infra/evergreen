/*
 * This hook adds the necessary database timestamps for any request coming into
 * the application
 */

module.exports = function (fieldName) {
  return async context => {
    context.data[fieldName] = new Date();
    return context;
  };
};
