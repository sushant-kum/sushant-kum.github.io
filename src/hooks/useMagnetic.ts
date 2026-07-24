import { useEffect, type RefObject } from 'react';

import { gsap } from '../lib/gsap';

/** Pull an element toward the pointer on hover. No-op on touch or reduced motion. */
export const useMagnetic = (ref: RefObject<HTMLElement | null>, enabled = true, strength = 0.4) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });

    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((ev.clientX - (r.left + r.width / 2)) * strength);
      yTo((ev.clientY - (r.top + r.height / 2)) * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [ref, enabled, strength]);
};
