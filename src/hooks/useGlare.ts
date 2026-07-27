import { useEffect, type RefObject } from 'react';

/** Track the pointer as CSS vars for a glare highlight. No-op on touch/reduced motion. */
export const useGlare = (ref: RefObject<HTMLElement | null>, enabled = true) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((ev.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--my', `${((ev.clientY - r.top) / r.height) * 100}%`);
      el.style.setProperty('--glare', '1');
    };
    const onLeave = () => el.style.setProperty('--glare', '0');
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, enabled]);
};
