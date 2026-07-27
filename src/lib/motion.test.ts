import { describe, it, expect, vi } from 'vitest';

import { gsap } from './gsap';
import { scrubReveal } from './motion';

describe('scrubReveal', () => {
  it('calls gsap.from with a scrubbed ScrollTrigger config', () => {
    const spy = vi.spyOn(gsap, 'from');
    const el = document.createElement('div');
    scrubReveal('.item', el);
    expect(spy).toHaveBeenCalledTimes(1);
    const vars = spy.mock.calls[0][1] as Record<string, unknown>;
    const st = vars.scrollTrigger as Record<string, unknown>;
    expect(st.scrub).toBe(true);
    expect(st.trigger).toBe(el);
    spy.mockRestore();
  });
});
