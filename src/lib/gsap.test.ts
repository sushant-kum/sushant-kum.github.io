import { describe, it, expect } from 'vitest';

import { gsap, ScrollTrigger } from './gsap';

describe('lib/gsap', () => {
  it('re-exports gsap and ScrollTrigger', () => {
    expect(gsap).toBeDefined();
    expect(ScrollTrigger).toBeDefined();
  });
});
