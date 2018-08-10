const PluginDependency = require('../cli/plugin-dependency');

describe('PluginDependency', () => {
  it('should be constructable', () => {
    expect(new PluginDependency()).toBeInstanceOf(PluginDependency);
  });


  describe('fromRecord()', () => {
    it('should create a proper object', () => {
      let record = {
        groupId: 'io.jenkins',
        artifactId: 'jest',
        version: '0.1',
      };
      let dep = PluginDependency.fromRecord(record);

      expect(dep).toBeInstanceOf(PluginDependency);
      expect(dep.version).toEqual(record.version);
      expect(dep.artifactId).toEqual(record.artifactId);
    });
  });

  describe('fromEntry', () => {
    it('should return null on an empty entry', () => {
      expect(PluginDependency.fromEntry('')).toBeNull();
    });

    it('should handle an entry', () => {
      let entry = 'structs:1.9';
      let dep = PluginDependency.fromEntry(entry);
      expect(dep).toBeInstanceOf(PluginDependency);
      expect(dep.version).toEqual('1.9');
      expect(dep.artifactId).toEqual('structs');
      expect(dep.isOptional()).toBeFalsy();
    });

    it('should handle an optional entry', () => {
      let entry = 'credentials:2.1.16;resolution:=optional';
      let dep = PluginDependency.fromEntry(entry);
      expect(dep).toBeInstanceOf(PluginDependency);
      expect(dep.version).toEqual('2.1.16');
      expect(dep.artifactId).toEqual('credentials');
      expect(dep.isOptional()).toBeTruthy();
    });
  });
});
