const Snapshotter = require('../src/lib/snapshotter');
const tmp         = require('tmp');
const fs          = require('fs');

describe('The snapshotting module', () => {

  let tmpDir = '';
  beforeEach(() => {
    tmpDir = tmp.dirSync({unsafeCleanup: true});
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  describe('init()', () => {
    it('should init a repo', () => {
      const snapshotter = new Snapshotter();
      snapshotter.init(tmpDir.name);

      // Called twice does not crash:
      // important since this is what will happen
      // on container/client restart
      snapshotter.init(tmpDir.name);
    });
  });
  describe('snapshot()', () => {
    it('should create a commit()', () => {
      const snapshotter = new Snapshotter();
      snapshotter.init(tmpDir.name);
      fs.writeFileSync(`${tmpDir.name}/blah.file`, 'something');
      snapshotter.snapshot('yay test message');

      const gitIgnore = fs.readFileSync(`${tmpDir.name}/.gitignore`,'utf-8');
      expect(gitIgnore).toContain('/plugins/');
      expect(gitIgnore).toContain('secrets/master.key');
    });
    it('should create a commit even without file()', () => {
      const snapshotter = new Snapshotter();
      snapshotter.init(tmpDir.name);

      snapshotter.snapshot('yay test message');
    });

    // TODO: test ./plugins is "gitignored"
  });

});
