import { useEffect, useRef } from 'react';

import styles from './CursorGlow.module.scss';
import { gsap } from '../../lib/gsap';

export const CursorGlow = () => {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const d = dot.current;
    const r = ring.current;
    if (!d || !r) return;

    document.body.classList.add('cursor-none');

    const dx = gsap.quickTo(d, 'x', { duration: 0.15, ease: 'power2.out' });
    const dy = gsap.quickTo(d, 'y', { duration: 0.15, ease: 'power2.out' });
    const rx = gsap.quickTo(r, 'x', { duration: 0.4, ease: 'power3.out' });
    const ry = gsap.quickTo(r, 'y', { duration: 0.4, ease: 'power3.out' });

    const onMove = (ev: PointerEvent) => {
      dx(ev.clientX);
      dy(ev.clientY);
      rx(ev.clientX);
      ry(ev.clientY);
    };
    const interactive = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest('a, button, [data-magnetic]');
    const onOver = (ev: PointerEvent) => {
      if (interactive(ev.target)) r.classList.add(styles.active);
    };
    const onOut = (ev: PointerEvent) => {
      if (interactive(ev.target)) r.classList.remove(styles.active);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerover', onOver);
    window.addEventListener('pointerout', onOut);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerout', onOut);
      document.body.classList.remove('cursor-none');
    };
  }, []);

  return (
    <>
      <div ref={ring} className={styles.ring} aria-hidden="true" />
      <div ref={dot} className={styles.dot} aria-hidden="true" />
    </>
  );
};
