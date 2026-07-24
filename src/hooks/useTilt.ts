import { useEffect, type RefObject } from 'react';

import { gsap } from '../lib/gsap';

/** Tilt an element toward the pointer in 3D. No-op on touch or reduced motion. */
export const useTilt = (ref: RefObject<HTMLElement | null>, max = 8) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power2.out' });
    const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power2.out' });

    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      rotY(px * max * 2);
      rotX(-py * max * 2);
    };
    const onLeave = () => {
      rotX(0);
      rotY(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.set(el, { rotationX: 0, rotationY: 0 });
    };
  }, [ref, max]);
};
