const UrlResolver = require('../cli/url-resolver');

describe('UrlResolver', () => {
  describe('artifactForPlugin()', () => {
    it('should handle an incremental version properly', () => {
      const plugin = {
        artifactId: 'configuration-as-code',
        groupId: 'io.jenkins',
        version: '0.11-alpha-rc362.942711740b07',
      };
      const expectedUrl = 'https://repo.jenkins-ci.org/incrementals/io/jenkins/configuration-as-code/0.11-alpha-rc362.942711740b07/configuration-as-code-0.11-alpha-rc362.942711740b07.hpi';
      expect(
        UrlResolver.artifactForPlugin(plugin)
      ).toEqual(expectedUrl);
    });

    it('should handle a normal relaese properly', () => {
      const plugin = {
        artifactId: 'blueocean',
        groupId: 'io.jenkins.blueocean',
        version: '1.7.2',
      };
      const expectedUrl = 'https://repo.jenkins-ci.org/releases/io/jenkins/blueocean/blueocean/1.7.2/blueocean-1.7.2.hpi';
      expect(
        UrlResolver.artifactForPlugin(plugin)
      ).toEqual(expectedUrl);
    });
  });

  describe('isIncremental()', () => {
    it('should return false on a standard semvar', () => {
      const plugin = { version: '1.7.2' };
      expect(UrlResolver.isIncremental(plugin)).toBeFalsy();
    });

    it('should return true for an incremental version', () => {
      const plugin = {
        version: '0.11-alpha-rc362.942711740b07',
      };
      expect(UrlResolver.isIncremental(plugin)).toBeTruthy();
    });
  });
});
