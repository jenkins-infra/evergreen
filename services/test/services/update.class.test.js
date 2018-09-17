const app           = require('../../src/app');
const createService = require('../../src/services/update/update.class');
const createModel   = require('../../src/models/update');

describe('update service class', () => {
  beforeEach(() => {
    this.app = {};
    const options = {
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
      const plugin = { url: 'http://jest.io', checksum: {} };
      const record = {
        manifest: {
          plugins: [plugin]
        },
      };

      expect(this.service.prepareManifestFromRecord(record, computed)).toBe(computed);

      expect(computed).toHaveProperty('plugins.updates', [plugin]);
    });

    it('should return for empty/undefined plugins', () => {
      const record = { manifest: {} };
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
      // how bland!
      it('should do nothing', () => {
        expect(this.service.prepareManifestWithFlavor(1, {}, computed)).resolves.toBe(computed);
      });
    });

    describe('when the `status` record has a flavor', () => {
      const instance = {
        flavor: 'docker-cloud',
      };

      it('should populate the manifest with the flavor\'s additions', async () => {
        const plugin = { url: 'http://jest.io', checksum: {} };
        const record = {
          manifest: {
            environments: {
              'docker-cloud': {
                plugins: [plugin]
              },
            }
          }
        };

        const result = await this.service.prepareManifestWithFlavor(instance, record, computed);
        expect(result).toBe(computed);
        expect(result).toHaveProperty('plugins.updates', [plugin]);
      });

      it('should accomodate empty flavors', async () => {
        const record = {
          manifest: {
            environments: {
              'docker-cloud': {},
            }
          }
        };

        const result = await this.service.prepareManifestWithFlavor(instance, record, computed);
        expect(result).toBe(computed);
        expect(result).toHaveProperty('plugins.updates');
      });

      it('should handle flavors which have superceding plugins', async () => {
        const plugin = {
          artifactId: 'jest',
          url: 'https://jest/1.0',
        };
        const computed = {
          plugins: {
            updates: [
              {
                artifactId: 'jest',
                url: 'https://jest/0.1',
              }
            ],
          },
        };

        const record = {
          manifest: {
            environments: {
              'docker-cloud': {
                plugins: [plugin],
              }
            }
          }
        };

        const result = await this.service.prepareManifestWithFlavor(instance, record, computed);
        expect(result).toBe(computed);
        expect(result).toHaveProperty('plugins.updates');
        expect(result.plugins.updates[0].url).toEqual('https://jest/1.0');
      });
    });
  });

  describe('filterVersionsForClient()', () => {
    beforeEach(() => {
      /*
       * Just a mock instance object for later
       */
      this.instance = {
        uuid: 'jest-uuid',
        flavor: 'docker-cloud',
      };
    });

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
        return expect(this.service.filterVersionsForClient(1, {})).resolves.toBeFalsy();
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
        it('should filter out core', async () => {
          const manifest = {
            core: {
              checksum: { signature: 'signature' },
            },
            plugins: {
              updates: [],
            },
          };
          expect.assertions(2);
          const result = await this.service.filterVersionsForClient(1, manifest);
          expect(result).toBeTruthy();
          expect(manifest.core).toMatchObject({});
        });
      });

      describe('when there are plugin updates available', () => {
        describe('when the client has no plugins', () => {
          /*
           * This is the behavior when there is an empty, but existing,
           * versions record.
           *
           * In the case of a flavored instance, filterVersionsForClient will
           * already have plugins prepared for it
           */
          it('should not override the plugins already computed', async () => {
            const updateManifest = {
              core: { checksum: { signature: null } },
              plugins: {
                updates: [
                  { url: 'https://docker.io', checksum: { signature: '0xdeadbeef' } },
                  { url: 'http://jenkins.io', checksum: { signature: '0xdeedee' } },
                ],
              },
            };
            const result = await this.service.filterVersionsForClient(1, updateManifest);
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
            const updateManifest = {
              core: { checksum: { signature: 'signature' } },
              plugins: {
                updates: [
                  {
                    artifactId: 'docker-plugin',
                    checksum: {
                      type: 'sha256',
                      signature: 'some-other-sha256',
                    },
                  },
                ],
              },
            };
            const result = await this.service.filterVersionsForClient(1, updateManifest);
            expect(result).toBeTruthy();
            expect(updateManifest.plugins.updates).toHaveLength(1);
          });
        });

        /*
         * See https://issues.jenkins-ci.org/browse/JENKINS-53318
         */
        describe('when the client has flavored plugins', () => {
          beforeEach(() => {
            const manifest = {
              jenkins: {
                core: 'signature',
                plugins: {
                  'docker-plugin' : 'sha256-for-docker-plugin.hpi',
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

          it('should not delete plugins in the flavor', async () => {
            const updateManifest = {
              core: { checksum: { signature: 'signature' } },
              plugins: {
                updates: [
                  {
                    artifactId: 'docker-plugin',
                    checksum: {
                      type: 'sha256',
                      signature: 'some-other-sha256',
                    },
                  },
                ],
              },
            };
            const result = await this.service.filterVersionsForClient(this.instance, updateManifest);
            expect(result).toBeTruthy();
            expect(updateManifest.plugins.deletes).toHaveLength(0);
            expect(updateManifest.plugins.updates).toHaveLength(1);
          });
        });
      });
    });
  });
});
