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

const homepage       = require('./homepage');
const middleware     = require('./middleware');
const models         = require('./models');
const services       = require('./services');
const appHooks       = require('./app.hooks');
const channels       = require('./channels');
const sequelize      = require('./sequelize');

const Sentry           = require('./libs/sentry');

const swagger          = require('feathers-swagger');
const sequelizeSwagger = require('./sequelize-swagger');

const settings = configuration();
const app = express(feathers());


// const SUCCESS = 'OK';
const FAILURE = 'ERROR';

/*
 * Allow the log level to be overridden in the environment for debugging
 * purposes by the user
 */
logger.level = process.env.LOG_LEVEL || 'warn';


/*
 * Configure Sentry integration only we have a SENTRY_DSN environment
 */
if (process.env.SENTRY_DSN) {
  logger.info('Configuring Sentry for backend errors..');
  const Raven = require('raven');
  Raven.config(process.env.SENTRY_DSN).install();
  app.use(Raven.requestHandler());
  app.use(Raven.errorHandler());
  logger.info('..Sentry middleware installed');
}

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
app.use('/public', express.static(app.get('public')));

// Set up Plugins and providers
app.configure(express.rest());
app.configure(socketio());
app.configure(sequelize);


/*
 * Initialize the Sentry backend integration for reporting error telemetry
 */
app.set('sentry', new Sentry(process.env.SENTRY_URL || app.get('sentry').url));

if (process.env.NODE_ENV != 'production') {
  app.configure(swagger({
    docsPath: '/apidocs',
    uiIndex: true,
    info: {
      title: 'Evergreen Backend APIs',
      description:
`These backend APIs are primarily for the \`evergreen-client\` to consume. There are a few scattered APIs which are required for the Evergreen distribution system's behind-the-scenes automated processes as well.

For more details and reasoning behind these APIs, please refer to the [Evergreen design documents](https://github.com/jenkins-infra/evergreen#design-documents) as well as this API documentation.
`,
    },
  }));
}

app.set('view engine', 'ejs');

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(models);
// Set up our services (see `services/index.js`)
app.configure(services);
// Set up event channels (see channels.js)
app.configure(channels);

app.use('/', homepage(app));

// Configure a middleware for 404s and the error handler
app.use(express.notFound());

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (!err.statusCode) {
    err.statusCode = (err.code ? err.code : 500);
  }
  if (!err.message) {
    err.message = 'Unexpected server error';
  }
  /* Avoid cluttering the test logs with expected errors and exceptions */
  if (process.env.NODE_ENV != 'test') {
    logger.error(err.stack);
    logger.debug(`statusCode: ${err.statusCode} message: ${err.message}`);
  }
  res.status(err.statusCode);
  res.json({ status: FAILURE, message: err.message });
});

app.hooks(appHooks);

/*
 * Need to configure the sequelizeSwagger after the services have all been
 * loaded and configured
 */
if (process.env.NODE_ENV != 'production') {
  app.configure(sequelizeSwagger);
}

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

setInterval(() => {
  const now = Date.now();
  logger.debug ('Sending ping at', now);
  app.service('status').emit('ping', { 'timestamp' : now});
}, (1000 * 60));

module.exports = app;
