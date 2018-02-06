/*
 * This module is responsible for handling ping commands
 */

const fetch     = require('node-fetch');

const util      = require('util');

const inspector = require('./inspector.js');

const ENDPOINT  = process.env.EVERGREEN_ENDPOINT;

let self = module.exports = {
  addListenerTo: function(eventSource) {
    eventSource.addEventListener('ping', function(e) {
      console.debug('Ping received:', e);
      self.sendPong();
    });
  },

  sendPong: function() {
    fetch(self.pongUrl(), {method: 'POST'})
      .then(response => { console.debug('Pong response:', response.status); });
  },

  pongUrl: function() {
    return util.format('%s/sse/pong/%s', ENDPOINT, inspector.identity());
  }
};
