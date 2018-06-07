/*
 * Main feathersjs application entrypoint
 */
const path           = require('path');
const favicon        = require('serve-favicon');
const compress       = require('compression');
const cors           = require('cors');
const helmet         = require('helmet');
const logger         = require('winston');

const feathers       = require('@feathersjs/feathers');
const configuration  = require('@feathersjs/configuration');
const express        = require('@feathersjs/express');
const socketio       = require('@feathersjs/socketio');
const authentication = require('@feathersjs/authentication');
const jwt            = require('@feathersjs/authentication-jwt');

const middleware     = require('./middleware');
const models         = require('./models');
const services       = require('./services');
const appHooks       = require('./app.hooks');
const channels       = require('./channels');
const sequelize      = require('./sequelize');


const settings = configuration();
const app = express(feathers());

// Load app configuration
app.configure(settings);
// Enable CORS, security, compression, favicon and body parsing
app.use(cors());
app.use(helmet());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());
app.configure(sequelize);


// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(models);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());

/* Avoid cluttering the test logs with expected errors and exceptions */
if (process.env.NODE_ENV != 'test') {
  app.use(express.errorHandler({ logger }));
}
else {
  app.use(express.errorHandler());
}

app.hooks(appHooks);

/* Configure the authentication provider via @feathersjs/authentication-jwt and
 * passport-jwt (https://github.com/themikenicholson/passport-jwt)
 */
const authConfig = app.get('jwt');
app.configure(authentication({
  name: authConfig.name,
  entity: 'authentication',
  service: 'authentication',
  secret: process.env.EVERGREEN_JWT_SECRET || authConfig.secret,
}));

app.configure(jwt({
  jsonWebTokenOptions: {
    expiresIn: authConfig.expiresIn,
  }
}));

/*
 * Override the internalAPI secret if it has been provided by the environment
 */
app.get('internalAPI').secret = process.env.EVERGREEN_INTERNAL_API_SECRET || app.get('internalAPI').secret;

module.exports = app;
