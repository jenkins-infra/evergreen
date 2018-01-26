//!/usr/bin/env node

const EventSource = require('eventsource');
const supervisor  = require('./lib/supervisor.js')

let s = new EventSource('http://127.0.0.1:9292/sse');

s.addEventListener('restart', (ev) => {
  console.log(ev);
    supervisor.isRunning().then((running) => {
        if (!running) { return; }
        console.log('Supervisord can be accessed..');

        supervisor.restartProcess('jenkins').then(() => {
            console.log('restarted....');
        });
    });

}, false);
s.onmessage = (ev) => {
  console.log(ev);
};
console.log(s);

module.exports = () => {
};
