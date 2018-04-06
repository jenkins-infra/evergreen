/*
 * This is to patch stupid behavior by brorand
 * (https://github.com/indutny/brorand)
 * which is used underneath elliptic for generating keys.
 *
 * It seems to not believe that we're in nodejs when we really are
 */

const crypto = require('crypto');
const rand   = require('brorand');

rand.Rand.prototype._rand = function _rand(n) {
  return crypto.randomBytes(n);
};
