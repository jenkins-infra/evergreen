const HealthChecker = require('../src/lib/healthchecker');
const logger        = require('winston');
const http          = require('http');

describe('The healthchecker module', () => {
  let server = null;
  let port = -1;

  // cf. https://github.com/jenkinsci/jep/tree/master/jep/306#specification
  // true below means: behave healthy
  // false configures the option to return unhealthy
  let serverOptions = {
    instanceIdentity: true,
    metrics: {
      plugins: true,
      deadlock: true
    }
  };

  describe('constructor', () => {
    it('should use default values if none passed in', () => {
      const healthChecker = new HealthChecker();
      expect(healthChecker.retry).toEqual(25);
      expect(healthChecker.delay).toEqual(3000);
      expect(healthChecker.factor).toEqual(1.10);
    });
    it('should use passed in values', () => {
      const jenkinsRootUrl = `http://localhost:${port}`;
      const requestOptions = {delay: 100, retry: 1, factor: 1.01};
      const healthChecker = new HealthChecker(jenkinsRootUrl, requestOptions);
      expect(healthChecker.jenkinsRootUrl).toEqual(jenkinsRootUrl);
      expect(healthChecker.retry).toEqual(requestOptions.retry);
      expect(healthChecker.delay).toEqual(requestOptions.delay);
      expect(healthChecker.factor).toEqual(requestOptions.factor);
    });
    it('should override the delay if env var set', () => {
      const retryOverride = 21;
      process.env.PROCESS_RETRY_OVERRIDE = retryOverride;
      const jenkinsRootUrl = `http://localhost:${port}`;
      const requestOptions = {delay: 100, retry: 1, factor: 1.01};
      const healthChecker = new HealthChecker(jenkinsRootUrl, requestOptions);
      expect(healthChecker.jenkinsRootUrl).toEqual(jenkinsRootUrl);
      expect(healthChecker.retry).toEqual(retryOverride);
      expect(healthChecker.delay).toEqual(requestOptions.delay);
      expect(healthChecker.factor).toEqual(requestOptions.factor);
    });
    it('should handle non int value in env var', () => {
      process.env.PROCESS_RETRY_OVERRIDE = true;
      const jenkinsRootUrl = `http://localhost:${port}`;
      const requestOptions = {delay: 100, retry: 1, factor: 1.01};
      const healthChecker = new HealthChecker(jenkinsRootUrl, requestOptions);
      expect(healthChecker.jenkinsRootUrl).toEqual(jenkinsRootUrl);
      expect(healthChecker.retry).toEqual(requestOptions.retry);
      expect(healthChecker.delay).toEqual(requestOptions.delay);
      expect(healthChecker.factor).toEqual(requestOptions.factor);
    });
  });

  describe('check()', () => {

    it('should pass cases', async (done) => {
      // ugly hack to wait a bit for the server to start...
      setTimeout( async () => {
        const healthChecker = new HealthChecker(`http://localhost:${port}`, {delay: 100, retry: 1});
        serverOptions.instanceIdentity = true;
        serverOptions.metrics.plugins = true;
        serverOptions.metrics.deadlock = true;
        serverOptions.metrics.body = true;

        let result = await healthChecker.check();
        expect(result.healthy).toBe(true);
        expect(result.message).not.toContain('wrong');

        // broken /instance-identity page
        serverOptions.instanceIdentity = false;
        result = await healthChecker.check();
        expect(result.healthy).toBe(false);

        // issue: a plugin is failed
        serverOptions.instanceIdentity = true;
        serverOptions.metrics.plugins = false;
        result = await healthChecker.check();
        expect(result.healthy).toBe(false);
        expect(result.message).toContain('wrong');

        // issue: deadlock
        serverOptions.instanceIdentity = true;
        serverOptions.metrics.plugins = true;
        serverOptions.metrics.deadlock = false;
        result = await healthChecker.check();
        expect(result.healthy).toBe(false);
        expect(result.message).toContain('wrong');

        // issue: no body
        serverOptions.instanceIdentity = true;
        serverOptions.metrics.plugins = true;
        serverOptions.metrics.deadlock = true;
        serverOptions.metrics.body = false;
        result = await healthChecker.check();
        expect(result.healthy).toBe(false);
        expect(result.message).toContain('No body');

        // back to all should work
        serverOptions.instanceIdentity = true;
        serverOptions.metrics.plugins = true;
        serverOptions.metrics.deadlock = true;
        serverOptions.metrics.body = true;
        result = await healthChecker.check();
        expect(result.healthy).toBe(true);

        done();
      }, 1000);

    });
  });

  // Code below handles the very simple embedded test http server code and cases
  // See serverOptions above for behavior "configuration" of this test server
  beforeEach( async (done) => {
    port = 3000; // Math.floor(Math.random() * (65535 - 1024) + 1024);

    let textReponse = 'Hello Node.js Server!';
    const requestHandler = (request, response) => {
      if (request.url.endsWith('/instance-identity/')) {
        if ( !serverOptions.instanceIdentity) {
          response.statusCode = 404;
        } else {
          textReponse = 'fake -----BEGIN PUBLIC KEY----- ...-----END PUBLIC KEY-----';
        }
      }
      if (request.url.endsWith('/metrics/evergreen/healthcheck')) {
        let pluginsHealthy = true;
        let noDeadlock = true;

        if (!serverOptions.metrics.plugins) {
          pluginsHealthy = false;
        }
        if (!serverOptions.metrics.deadlock) {
          noDeadlock = false;
        }
        if (!serverOptions.metrics.body) {
          textReponse = '';
        } else {
          textReponse = JSON.stringify({
            'disk-space': {
              healthy: true
            },
            plugins: {
              healthy: pluginsHealthy,
              message: 'No failed plugins'
            },
            'temporary-space': {
              healthy: true
            },
            'thread-deadlock': {
              healthy: noDeadlock
            }
          });
        }
      }
      response.end(textReponse);
    };

    server = http.createServer(requestHandler);

    logger.debug(`Start server on port ${port}`);
    server.listen(port, (err) => {
      if (err) {
        return logger.error('something bad happened', err);
      }

      logger.info(`Test server is listening on ${port}`);
      done();
    });
  });

  afterEach( async (done) => {
    server.close(() => {
      logger.debug('HTTP server shutdown');
      done();
    });
  });

});
