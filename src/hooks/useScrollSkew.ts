import { useEffect, type RefObject } from 'react';

import { gsap, ScrollTrigger } from '../lib/gsap';

/** Skew an element by clamped scroll velocity, easing back to 0 at rest. */
export const useScrollSkew = (ref: RefObject<HTMLElement | null>, max = 3) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const setSkew = gsap.quickTo(el, 'skewY', { duration: 0.5, ease: 'power3.out' });
    let reset: ReturnType<typeof gsap.delayedCall> | null = null;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self: { getVelocity: () => number }) => {
        const v = Math.max(-max, Math.min(max, self.getVelocity() / -350));
        setSkew(v);
        reset?.kill();
        reset = gsap.delayedCall(0.15, () => setSkew(0));
      },
    });
    return () => {
      reset?.kill();
      st.kill?.();
      gsap.set(el, { skewY: 0 });
    };
  }, [ref, max]);
};
