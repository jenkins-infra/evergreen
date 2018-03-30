/*
 * The authentication module is responsible for logging in an
 * already-registered client and holding onto the JSON Web Token
 */

class Auth {
  constructor (options) {
    this.options = options || {};
  }

  getToken() {
    return this.token;
  };

  setToken(t) {
    this.token = t;
  }
};

module.exports = new Auth();
