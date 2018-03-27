/*
 * The registration module is responsible for managing the initial registration
 * of the evergreen-client with the backend services layer
 */

module.exports = {
  /*
   * Determine whether the keys are already present on the filesystem
   *
   * @return Boolean
   */
  hasKeys: function() {
    return false;
  }
};
