import { useEffect, useRef, useState } from 'react';

import styles from './Nav.module.scss';
import { gsap, ScrollTrigger } from '../../lib/gsap';

const LINKS = [
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'projects', label: 'projects' },
  { id: 'skills', label: 'skills' },
  { id: 'contact', label: 'contact' },
];

export const Nav = () => {
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState<string>('');

  // active-section tracking (batch 1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const triggers = LINKS.map((l) => {
      const section = document.getElementById(l.id);
      if (!section) return null;
      return ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self: { isActive: boolean }) => {
          if (self.isActive) setActive(l.id);
        },
      });
    });
    return () => triggers.forEach((t) => t?.kill?.());
  }, []);

  // slide the indicator under the active link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const list = listRef.current;
    const ind = indicatorRef.current;
    if (!list || !ind) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const positionIndicator = () => {
      const activeEl = list.querySelector<HTMLElement>(`[data-id="${active}"]`);
      if (!activeEl) {
        gsap.set(ind, { opacity: 0 });
        return;
      }
      const vars = { x: activeEl.offsetLeft, width: activeEl.offsetWidth, opacity: 1 };
      if (reduce) gsap.set(ind, vars);
      else gsap.to(ind, { ...vars, duration: 0.4, ease: 'power3.out' });
    };
    positionIndicator();
    window.addEventListener('resize', positionIndicator);
    return () => window.removeEventListener('resize', positionIndicator);
  }, [active]);

  return (
    <nav className={styles.nav} aria-label="Primary">
      <a className={styles.brand} href="#top">
        SK<span>.</span>
      </a>
      <ul ref={listRef} className={styles.links}>
        {LINKS.map((l) => (
          <li key={l.id}>
            <a
              href={`#${l.id}`}
              data-id={l.id}
              className={active === l.id ? styles.active : undefined}
              aria-current={active === l.id ? 'true' : undefined}
            >
              {l.label}
            </a>
          </li>
        ))}
        <span ref={indicatorRef} className={styles.indicator} aria-hidden="true" />
      </ul>
    </nav>
  );
};
