'use strict';

const Ingest = require('../cli/ingest');

describe('Ingest', () => {
  it('should be constructable', () => {
    expect(new Ingest()).toBeInstanceOf(Ingest);
  });
});
