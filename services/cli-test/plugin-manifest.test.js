const PluginManifest = require('../cli/plugin-manifest');

describe('PluginManifest', () => {
  it('should be constructable', () => {
    expect(new PluginManifest()).toBeInstanceOf(PluginManifest);
  });

  describe('load()', () => {
    it('should return an instance', () => {
      expect(PluginManifest.load({})).toBeInstanceOf(PluginManifest);
    });
  });

  describe('parse()', () => {
    let manifest = null;

    describe('with empty data', () => {
      beforeEach(() => {
        manifest = PluginManifest.load('');
      });
      it('should have no dependencies', () => {
        let parsed = manifest.parse();
        expect(parsed).toBe(manifest);
        expect(parsed.dependencies).toHaveLength(0);
      });
    });

    describe('with a manifest containing no dependencies', () => {
      beforeEach(() => {
        manifest = PluginManifest.load(`
Manifest-Version: 1.0
Archiver-Version: Plexus Archiver
Created-By: Apache Maven
Built-By: magnayn
Build-Jdk: 1.6.0_22
Extension-Name: AdaptivePlugin
Specification-Title: This (experimental) plug-in exposes the jenkins b
 uild extension points (SCM, Build, Publish) to a groovy scripting env
 ironment that has        some DSL-style extensions for ease of develo
 pment.
Implementation-Title: AdaptivePlugin
Implementation-Version: 0.1
Group-Id: jenkins
Short-Name: AdaptivePlugin
Long-Name: Jenkins Adaptive DSL Plugin
Url: http://wiki.jenkins-ci.org/display/JENKINS/Jenkins+Adaptive+Plugin
Plugin-Version: 0.1
Hudson-Version: null
Plugin-Developers: Nigel Magnay:magnayn:nigel.magnay@gmail.com
`);
      });

      it('should have no dependencies', () => {
        let parsed = manifest.parse();
        expect(parsed).toBe(manifest);
        expect(parsed.dependencies).toHaveLength(0);
      });
    });

    describe('with a manifest containing dependencies', () => {
      beforeEach(() => {
        manifest = PluginManifest.load(`
Manifest-Version: 1.0
Archiver-Version: Plexus Archiver
Created-By: Apache Maven
Built-By: mwaite
Build-Jdk: 1.8.0_181
Extension-Name: git-client
Specification-Title: Utility plugin for Git support in Jenkins
Implementation-Title: git-client
Implementation-Version: 2.7.3
Group-Id: org.jenkins-ci.plugins
Short-Name: git-client
Long-Name: Jenkins Git client plugin
Url: https://wiki.jenkins.io/display/JENKINS/Git+Client+Plugin
Plugin-Version: 2.7.3
Hudson-Version: 1.625.3
Jenkins-Version: 1.625.3
Plugin-Dependencies: apache-httpcomponents-client-4-api:4.5.3-2.0,cred
 entials:2.1.13,jsch:0.1.54.1,ssh-credentials:1.13,structs:1.9
Plugin-Developers: Mark Waite:markewaite:mark.earl.waite@gmail.com
`);
      });

      it('should have dependencies', () => {
        let parsed = manifest.parse();
        expect(parsed).toBe(manifest);
        expect(parsed.dependencies).toHaveLength(5);
      });

    });
  });
});
