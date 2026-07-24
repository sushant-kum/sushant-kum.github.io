import { describe, it, expect } from 'vitest';

import { gsap, ScrollTrigger, SplitText } from './gsap';

describe('lib/gsap', () => {
  it('re-exports gsap, ScrollTrigger and SplitText', () => {
    expect(gsap).toBeDefined();
    expect(ScrollTrigger).toBeDefined();
    expect(SplitText).toBeDefined();
  });
});
