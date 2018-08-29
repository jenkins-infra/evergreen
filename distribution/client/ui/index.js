console.info('Loading Evergreen UI');

const feathers = require('@feathersjs/feathers');
const socketio = require('@feathersjs/socketio-client');
const io       = require('socket.io-client');

const socket = io('', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax : 5000,
  reconnectionAttempts: Infinity
});

const app = feathers();
app.configure(socketio(socket));

socket.on('connect', () => {
  console.info('Connected to the Evergreen socket.io channel');
  for (let el of document.getElementsByClassName('status-indicator')) {
    el.setAttribute('class', 'status-indicator connected');
  }

  socket.emit('find', 'messages', {}, (error, data) => {
    console.log('Found messages', data);
    data.forEach(m => window.addEvergreenMessage(m));
  });
});

socket.on('disconnect', () => {
  for (let el of document.getElementsByClassName('status-indicator')) {
    el.setAttribute('class', 'status-indicator disconnected');
  }
});
socket.on('reconnect', () => {
  console.info('Reconnecting the socket.io channel');
});

app.service('messages').on('created', (data) => {
  console.log('Received message from the backend:', data);
  window.addEvergreenMessage(data);
});

/*
 * Really crappy manual HTML construction, this should clearly be improved in
 * the future
 */
window.addEvergreenMessage = (data) => {
  const containers = document.getElementsByClassName('messages');

  const el = document.createElement('div');
  el.setAttribute('class', 'message');

  const m = document.createElement('pre');
  m.innerHTML = data.message;

  el.appendChild(m);

  for (let item of containers) {
    item.prepend(el);
  }
};
