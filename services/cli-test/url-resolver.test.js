const UrlResolver = require('../cli/url-resolver');

describe('UrlResolver', () => {
  describe('artifactForCore()', () => {
    it('should return a mirrored URL for normal releases', () => {
      const core = {
        version: '2.135',
      };
      const expectedUrl = 'http://mirrors.jenkins.io/war/2.135/jenkins.war';
      expect(UrlResolver.artifactForCore(core)).toEqual(expectedUrl);
    });

    it('should return an incremental URL for an incremental version', () => {
      const core = {
        version: '2.137-rc15096.84158a22fc46',
      };
      const expectedUrl = 'https://repo.jenkins-ci.org/incrementals/org/jenkins-ci/main/jenkins-war/2.137-rc15096.84158a22fc46/jenkins-war-2.137-rc15096.84158a22fc46.war';
      expect(UrlResolver.artifactForCore(core)).toEqual(expectedUrl);
    });
  });
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
