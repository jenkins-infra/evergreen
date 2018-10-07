import Periodic from '../src/lib/periodic';

describe('The periodic module', () => {
  /* Just a simple fake app for unit test
   */
  describe('runHourly()', () => {
    it('allow registration of an hourly callback', () => {
      const p = new Periodic();
      expect(p.runHourly('jest-fun', () => {})).toBeTruthy();
    });
  });

  describe('runDaily()', () => {
    it('allows registration of a daily callback', () => {
      const p = new Periodic();
      expect(p.runDaily('jest-fun', () => {})).toBeTruthy();
    });
  });

  describe('computeOffset()', () => {
    const p = new Periodic();

    it('should return a number between 0-59', () => {
      const offset = p.computeOffset();
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThanOrEqual(59);
    });
  });
});
