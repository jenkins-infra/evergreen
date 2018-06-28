const rp = require('request-promise');
const url = require('url');
const app = require('../src/app');

const port = app.get('port') || 3030;
const getUrl = pathname => url.format({
  hostname: app.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});

describe('Feathers application tests', () => {
  beforeAll(function(done) {
    this.server = app.listen(port);
    this.server.once('listening', () => done());
  });

  afterAll(function(done) {
    this.server.close(done);
  });

  it('starts and shows the index page', () => {
    return rp(getUrl()).then(body => {
      expect(body).toEqual(expect.stringContaining('<html>'));
    });
  });
});
