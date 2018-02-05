const assert    = require('assert');
const inspector = require('../lib/inspector.js');
const simple    = require('simple-mock');

describe('The inspector module', function() {
  it('pathToCore() should return the standard path', function() {
    assert.equal(inspector.pathToCore(), '/usr/share/jenkins/jenkins.war');
  });

  it('pathToPlugins() should return the standard path', function() {
    assert.equal(inspector.pathToPlugins(), '/var/jenkins_home/plugins');
  });

  context('md5OfCore', function() {
    it('should throw an error if it cannot find a core', function() {
      /* assuming that in our test environment, the jenkins.war cannot be
        * found in the expected location
        */
      assert.throws(() => { inspector.md5OfCore() }, inspector.InspectorError );
    });

    context('with mock-jenkins.war', function() {
      const mockHex = '87e290faf1b1b5a61101d31f85d4eb2f';

      beforeEach(function() {
        simple.mock(inspector, 'pathToCore', () => { return 'test/mock-jenkins.war'});
      });
      afterEach(function() { simple.restore(); });

      it('should return and md5 string when it can find a core', function() {
        let hex = inspector.md5OfCore();
        assert.equal(hex, mockHex);
      });
    });
  });

  context('pluginFiles', function() {
    it('should return an empty array when there are no plugins', function() {
      let plugins = inspector.pluginFiles();

      assert.equal(plugins.length, 0);
    });

    context('with mock-plugins/', function() {
      beforeEach(function() {
        simple.mock(inspector, 'pathToPlugins', () => { return 'test/mock-plugins' });
      });
      afterEach(function() { simple.restore(); });

      it('should return an array of one jpi', function() {
        let plugins = inspector.pluginFiles();
        assert.equal(plugins.length, 1);
      });
    });
  });

  context('infoFromZip', function() {
    context('with mock-plugins/', function() {
      beforeEach(function() {
        simple.mock(inspector, 'pathToPlugins', () => { return 'test/mock-plugins' });
      });
      afterEach(function() { simple.restore(); });

      it('should parse the version from the .jpi (zip) MANIFEST.MF', async function() {
        let info = await inspector.infoFromZip('ansicolor.jpi');

        assert.equal(info.version, '0.5.2');
        assert.equal(info.ident, 'ansicolor');
      });

    });
  });
});
