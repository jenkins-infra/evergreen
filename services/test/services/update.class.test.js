const app           = require('../../src/app');
const createService = require('../../src/services/update/update.class');
const createModel   = require('../../src/models/update');

describe('update service class', () => {
  beforeEach(() => {
    this.app = {};
    let options = {
      app: this.app,
      name: 'update',
      Model: createModel(app),
    };
    this.service = createService(options);
  });

  describe('prepareManifestFromRecord()', () => {
    let computed = {};

    beforeEach(() => {
      computed = {
        plugins: {
          updates: [],
        },
      };
    });

    it('should handle an empty record properly', () => {
      expect(this.service.prepareManifestFromRecord({}, computed)).toBe(computed);
    });

    it('should populate the manifest', () => {
      let plugin = { url: 'http://jest.io', checksum: {} };
      let record = {
        manifest: {
          plugins: [plugin]
        },
      };

      expect(this.service.prepareManifestFromRecord(record, computed)).toBe(computed);

      expect(computed).toHaveProperty('plugins.updates', [plugin]);
    });

    it('should return for empty/undefined plugins', () => {
      let record = { manifest: {} };
      expect(this.service.prepareManifestFromRecord(record, computed)).toBe(computed);
    });
  });

  describe('prepareManifestWithFlavor()', () => {
    let computed = {
      plugins: {
        updates: [],
      },
    };


    describe('when there is no `status` record yet', () => {
      beforeEach(() => {
        this.app.service = () => {
          return {
            get: () => {
              return null;
            },
          };
        };
      });

      // how bland!
      it('should do nothing', () => {
        expect(this.service.prepareManifestWithFlavor(1, {}, computed)).resolves.toBe(computed);
      });
    });

    describe('when the `status` record has a flavor', () => {
      beforeEach(() => {
        this.app.service = () => {
          return {
            get: () => {
              return {
                flavor: 'docker-cloud',
              };
            },
          };
        };
      });

      it('should populate the manifest with the flavor\'s additions', async () => {
        let plugin = { url: 'http://jest.io', checksum: {} };
        let record = {
          manifest: {
            environments: {
              'docker-cloud': {
                plugins: [plugin]
              },
            }
          }
        };

        let result = await this.service.prepareManifestWithFlavor(1, record, computed);
        expect(result).toBe(computed);
        expect(result).toHaveProperty('plugins.updates', [plugin]);
      });

      it('should accomodate empty flavors', async () => {
        let record = {
          manifest: {
            environments: {
              'docker-cloud': {},
            }
          }
        };

        let result = await this.service.prepareManifestWithFlavor(1, record, computed);
        expect(result).toBe(computed);
        expect(result).toHaveProperty('plugins.updates');
      });

      it('should handle flavors which have superceding plugins', async () => {
        let plugin = {
          artifactId: 'jest',
          url: 'https://jest/1.0',
        };
        let computed = {
          plugins: {
            updates: [
              {
                artifactId: 'jest',
                url: 'https://jest/0.1',
              }
            ],
          },
        };

        let record = {
          manifest: {
            environments: {
              'docker-cloud': {
                plugins: [plugin],
              }
            }
          }
        };

        let result = await this.service.prepareManifestWithFlavor(1, record, computed);
        expect(result).toBe(computed);
        expect(result).toHaveProperty('plugins.updates');
        expect(result.plugins.updates[0].url).toEqual('https://jest/1.0');
      });
    });
  });

  describe('filterVersionsForClient()', () => {
    describe('with no pre-existing versions', () => {
      beforeEach(() => {
        this.app.service = () => {
          return {
            find: () => {
              return [];
            },
          };
        };
      });

      it('should return false, indicating no filtering', () => {
        expect(this.service.filterVersionsForClient(1, {})).resolves.toBeFalsy();
      });
    });

    describe('with pre-existing versions', () => {
      beforeEach(() => {
        this.app.service = () => {
          return {
            find: () => {
              return [{
                manifest: {
                  jenkins: {
                    core: 'signature',
                    plugins: [],
                  },
                },
              }];
            },
          };
        };
      });

      describe('when the core is identical', () => {
        let update = {
          manifest: {
            core: {
              checksum: {
                signature: 'signature',
              },
            },
          },
        };

        it('should filter out core', async () => {
          let manifest = {
            plugins: [],
          };
          expect.assertions(2);
          let result = await this.service.filterVersionsForClient(1, update, manifest);
          expect(result).toBeTruthy();
          expect(manifest.core).toMatchObject({});
        });
      });

      describe('when there are plugin updates available', () => {
        let update = {
          manifest: {
            core: { checksum: { signature: null } },
            plugins: [
              {
                url: 'http://jest.io',
                checksum: { signature: '0xdeadbeef' },
              },
            ],
          },
        };

        describe('when the client has no plugins', () => {
          /*
           * This is the behavior when there is an empty, but existing,
           * versions record.
           *
           * In the case of a flavored instance, filterVersionsForClient will
           * already have plugins prepared for it
           */
          it('should not override the plugins already computed', async () => {
            let updateManifest = {
              core: {},
              plugins: {
                updates: [
                  { url: 'https://docker.io', checksum: { signature: '0xdeadbeef' } },
                  { url: 'http://jenkins.io', checksum: { signature: '0xdeedee' } },
                ],
              },
            };
            let result = await this.service.filterVersionsForClient(1, update, updateManifest);
            expect(result).toBeTruthy();
            expect(updateManifest.plugins.updates).toHaveLength(2);
          });
        });

        describe('when the client has plugins', () => {
          beforeEach(() => {
            const manifest = {
              jenkins: {
                core: 'signature',
                plugins: {
                  'git-client' : 'sha256-for-git-client.hpi',
                },
              }
            };

            this.app.service = () => {
              return {
                find: () => {
                  return [{
                    manifest: manifest,
                  }];
                },
              };
            };
          });

          it('should only update plugins which need updating', async () => {
            let updateManifest = {
              core: {},
              plugins: {},
            };
            let result = await this.service.filterVersionsForClient(1, update, updateManifest);
            expect(result).toBeTruthy();
            expect(updateManifest.plugins.updates).toHaveLength(1);
          });
        });
      });
    });
  });
});
