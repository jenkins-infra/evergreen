jest.mock('fs');

const assert       = require('assert');
const path         = require('path');
const Registration = require('../lib/registration');

describe('The registration module', () => {
  describe('register()', () => {
    it('should return a Promise', () => {
      const response = (new Registration()).register();
      assert(response instanceof Promise);
    });
  });

  describe('getPublicKey()', () => {
    it('should return null on a new instance', () => {
      const r = new Registration();
      assert.equal(null, r.getPublicKey());
    });

    it('should return a public key after generateKeys() has been called', () => {
      const r = new Registration();
      assert(r.generateKeys());
      assert.equal(typeof r.getPublicKey(), 'string');
    });
  });

  describe('saveKeysSync()', () => {
    beforeEach(() => {
      this.fs = require('memfs');
    });

    it('should return false if there are not keys', () => {
      const r = new Registration();
      assert(!r.saveKeysSync());
    });

    describe('when keys have been generated', () => {
      beforeEach(() => {
        this.reg = new Registration();
        this.reg.generateKeys();
      });
      it('should return true if the public key has been written', () => {
        assert(this.reg.saveKeysSync());
        try {
          this.fs.statSync(this.reg.publicKeyPath());
        }
        catch (err) {
          assert.fail('The public key was not written properly');
        }

        try {
          const privateKeyPath = [this.reg.keyPath(),
            'evergreen-private-key'].join(path.sep);

          this.fs.statSync(privateKeyPath);
        }
        catch (err) {
          assert.fail('The private key was not written properly');
        }
      });
    });
  });

  describe('hasKeys()', () => {
    it('should return false by default', () => {
      assert.equal(false, (new Registration()).hasKeys());
    });
  });

  describe('generateKeys()', () => {
    it('should return a boolean on success', () => {
      assert.ok((new Registration()).generateKeys());
    });
  });

  describe('publicKeyPath()', () => {
    it('should return a path', () => {
      const p = (new Registration()).publicKeyPath();
      assert(p != path.basename(p), 'This doesn\'t look like a path');
    });
  });

  describe('keyPath()', () => {
    beforeEach(() => {
      this.fs = require('memfs');
    });

    it('should return a path', () => {
      const keys = (new Registration()).keyPath();
      assert(keys != path.basename(keys), 'This doesn\'t look like a path');
    });

    it('should create a directory if one does not exist', () => {
      const keyPath = (new Registration()).keyPath();
      const stats = this.fs.statSync(keyPath);
      assert(stats.isDirectory());
    });

    it('should not exist by default', () => {
      /* this is really a test to make sure memfs is behaving appropriately */
      try {
        this.fs.statSync('/evergreen/keys');
      }
      catch (err) {
        assert.equal(err.code, 'ENOENT');
      }
    });
  });

  describe('homeDirectory()', () => {
    it('should return a path', () => {
      const p = (new Registration()).homeDirectory();
      assert(p != path.basename(p), 'This doesn\'t look like a path');
    });
  });

});
