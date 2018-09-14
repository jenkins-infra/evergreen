const rp = require('request-promise');
const h  = require('./helpers');

describe('Feathers application tests', () => {
  beforeAll(done => h.startApp(done));
  afterAll(done => h.stopApp(done));

  it('starts and shows the index page', () => {
    return rp(h.getUrl()).then(body => {
      expect(body).toEqual(expect.stringContaining('<html>'));
    });
  });
});
