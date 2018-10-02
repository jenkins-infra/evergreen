const logger        = require('winston');
const rp            = require('promise-request-retry');

const INSTANCE_IDENTITY_URL = '/instance-identity/';
const METRICS_URL           = '/metrics/evergreen/healthcheck';

class HealthChecker {

  constructor(jenkinsRootUrl, requestOptions = {}) {
    this.jenkinsRootUrl = jenkinsRootUrl;
    // let's target ~3 to 5 minutes overall of attempts for updates to arrive + Jenkins to start
    // TODO: later, introduce some smarter delay depending on the number of things to download?
    // values below are ~ 4.5 minutes
    this.retry = requestOptions.retry || 25;
    this.delay = requestOptions.delay || 3000;
    this.factor = requestOptions.factor || 1.10;

    if (process.env.PROCESS_RETRY_OVERRIDE) {
      const overrideCandidate = parseInt(process.env.PROCESS_RETRY_OVERRIDE, 10);
      if (!isNaN(overrideCandidate)) {
        logger.warn(`Using overridden value for number of retries for requests: ${overrideCandidate} used instead of ${this.retry}`);
        this.retry = overrideCandidate;
      } else {
        logger.error(`PROCESS_RETRY_OVERRIDE env var should be an integer >= 1 (provided=${process.env.PROCESS_RETRY_OVERRIDE}`);
      }
    }
    this.defaultRequestOptions = {
      verboseLogging: true,
      method: 'GET',
      headers: {
        'User-Agent': 'evergreen-client'
      },
      simple: true,
      resolveWithFullResponse: true,
      encoding: 'utf-8',
      timeout: 3 * 1000,
      retry: this.retry,
      delay: this.delay,
      factor: this.factor
    };
  }

  async check() { // TODO : add options.timeout etc.

    const checks = [];

    checks.push(this.checkInstanceIdentity());
    checks.push(this.checkMetrics());

    return Promise.all(checks)
      .then( () => {
        return {
          healthy: true,
          message: 'All checks were successful. Instance deemed healthy.'
        };
      })
      .catch( error => {
        return {
          healthy: false,
          message: `Something went wrong: ${error}`
        };
      });

  }

  checkInstanceIdentity() {
    const options = Object.assign({}, this.defaultRequestOptions, {
      uri: `${this.jenkinsRootUrl}${INSTANCE_IDENTITY_URL}`,
      json: false
    });

    logger.debug('Checking instance identity URL');
    return rp(options)
      .then(response => {
        const body = response.body;
        // simplistic check that we should be on the expected page
        // see https://ci.jenkins.io/instance-identity/ for instance
        if ( body.indexOf('-----BEGIN PUBLIC KEY-----') > -1 &&
            body.indexOf('-----END PUBLIC KEY-----') > -1 ) {
          logger.debug('/instance-identity/ URL OK');
        } else {
          const errMsg = 'Could not find the public key in the instance-identity page';
          logger.error(errMsg);
          throw new Error(errMsg);
        }
      });
  }

  checkMetrics() {
    const options = Object.assign({}, this.defaultRequestOptions, {
      uri: `${this.jenkinsRootUrl}${METRICS_URL}`,
      json: true
    });

    logger.debug('Checking metrics Evergreen healthchecking URL');
    return rp(options).
      then( response => {
        if (!response.body) {
          throw new Error('No body');
        }
        if (!(response.body instanceof Object)) {
          throw new Error(`Body is not an object! '${response.body}'`);
        }
        if (!response.body['thread-deadlock'].healthy) {
          throw new Error('There is a deadlock!');
        }
        if (!response.body.plugins.healthy) {
          throw new Error(`Plugins are not healthy! '${response.body.plugins.healthy}'`);
        }
        logger.debug(`metrics healthchecking endpoint: everything looks fine: ${JSON.stringify(response.body)}`);
      });
  }
}

module.exports = HealthChecker;
