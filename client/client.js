//!/usr/bin/env node

const EventSource = require('eventsource');

console.log("Hello");


let stream = new EventSource('http://127.0.0.1:9292/sse');

stream.onmessage = (ev) => {
  console.log(ev);
};


module.exports = () => {
};
