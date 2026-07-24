import { useEffect, useRef } from 'react';

import styles from './CursorGlow.module.scss';
import { gsap } from '../../lib/gsap';

export const CursorGlow = () => {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);

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
    const lx = gsap.quickTo(label.current, 'x', { duration: 0.2, ease: 'power2.out' });
    const ly = gsap.quickTo(label.current, 'y', { duration: 0.2, ease: 'power2.out' });

    const onMove = (ev: PointerEvent) => {
      dx(ev.clientX);
      dy(ev.clientY);
      rx(ev.clientX);
      ry(ev.clientY);
      lx(ev.clientX);
      ly(ev.clientY);
    };
    const interactive = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest('a, button, [data-magnetic]');
    const onOver = (ev: PointerEvent) => {
      const t = ev.target;
      const labelled = t instanceof Element ? t.closest<HTMLElement>('[data-cursor]') : null;
      if (labelled && label.current) {
        label.current.textContent = labelled.dataset.cursor ?? '';
        label.current.classList.add(styles['label-show']);
        r.classList.add(styles.active);
      } else if (interactive(ev.target)) {
        r.classList.add(styles.active);
      }
    };
    const onOut = (ev: PointerEvent) => {
      const t = ev.target;
      if (t instanceof Element && t.closest('[data-cursor]') && label.current) {
        label.current.classList.remove(styles['label-show']);
      }
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
      <div ref={label} className={styles.label} aria-hidden="true" />
    </>
  );
};
