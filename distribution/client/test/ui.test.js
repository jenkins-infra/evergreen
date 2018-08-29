const UI = require('../src/lib/ui');

describe('The UI module', () => {
  it('should be a singleton', () => {
    expect(UI).toBe(UI);
  });
});
