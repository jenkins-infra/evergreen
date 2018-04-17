jest.mock('fs');

const assert         = require('assert');
const fs             = require('fs');
const ErrorTelemetry = require('../src/lib/error-telemetry');
const mkdirp         = require('mkdirp');

describe('Error Telemetry Logging', () => {
  beforeEach(() => {
    /* Make sure memfs is flushed every time */
    fs.volume.reset();
  });

  describe('setup() call', () => {

    // FIXME: only hackish, the end goal is definitely not to forward to another file
    it('writing to essentials logging file should forward to another', done => {

      // Write before setup to make sure the file is already present
      const logsDir = '/evergreen/jenkins/var/logs/';
      const logFile = logsDir + 'essentials.log.0';
      mkdirp.sync(logsDir);
      fs.writeFileSync(logFile, '{"timestamp":1523451065975,"level":"SEVERE","message":"WAT"}\n');

      assert(fs.existsSync(logFile));

      mkdirp.sync('/tmp');
      const response = new ErrorTelemetry().setup();
      assert(!(response instanceof Promise));

      assert(!fs.existsSync('/tmp/test'));

      setTimeout( () => {
        fs.appendFileSync(logFile, '{"timestamp":1523451065975,"level":"SEVERE","message":"WAT2"}\n');
      }, 1000);

      setTimeout( () => {
        assert(fs.existsSync('/tmp/test'));
        const actual = fs.readFileSync('/tmp/test','utf8');
        assert.equal(actual, 'MESSAGE=WAT\nMESSAGE=WAT2\n');
        done();
      }, 2000);
    });
  });
});
