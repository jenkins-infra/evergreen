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
  beforeEach(async () => {
    /* Need to forcefully await to ensure that we don't execute any other
      * tests
      */
    await app.service('status').remove(null, { query: { $limit: 1000 } });
  });

  it('registered the service', () => {
    const service = app.service('status');

    assert.ok(service, 'Registered the service');
  });

  it('has no status by default', async () => {
    const items = await app.service('status').find();
    assert.equal(items.length, 0);
  });
});
