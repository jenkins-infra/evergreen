/*
 * This file contains integration tests for the 'status' service which is
 * primarily involved in managing `Instance` data
 */

const assert = require('assert');
const uuid = require('uuid/v4');
// eslint-disable-next-line no-unused-vars
const logger = require('winston');

const app = require('../../src/app');

describe('\'status\' service', () => {
  it('registered the service', () => {
    const service = app.service('status');

    assert.ok(service, 'Registered the service');
  });

  it('has no status by default', async () => {
    const items = await app.service('status').find();
    assert.equal(items.total, 0, 'Status records were found');
  });

  describe('creating Status', () => {
    it('should allow a new Status to be created', async () => {
      const service = app.service('status');
      const response = await service.create({
        uuid: uuid()
      }, {});

      assert.ok(response, 'Response looks acceptable');

    });
    afterEach(async () => {
      /* Need to forcefully await to ensure that we don't execute any other
       * tests
       */
      logger.debug('Removing entries from the `status` service');
      await app.service('status').remove(null, { query: { $limit: 1000 } });
    });
  });

});
