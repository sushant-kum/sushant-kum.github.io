import { describe, it, expect } from 'vitest';

import { stats } from './stats';

describe('stats data', () => {
  it('has four positive-valued stats with labels', () => {
    expect(stats).toHaveLength(4);
    for (const s of stats) {
      expect(s.value).toBeGreaterThan(0);
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});
