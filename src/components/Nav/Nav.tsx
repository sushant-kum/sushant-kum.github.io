import { useEffect, useState } from 'react';

import styles from './Nav.module.scss';
import { ScrollTrigger } from '../../lib/gsap';

const LINKS = [
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'projects', label: 'projects' },
  { id: 'skills', label: 'skills' },
  { id: 'contact', label: 'contact' },
];

export const Nav = () => {
  const [active, setActive] = useState<string>('');

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

  return (
    <nav className={styles.nav} aria-label="Primary">
      <a className={styles.brand} href="#top">
        SK<span>.</span>
      </a>
      <ul className={styles.links}>
        {LINKS.map((l) => (
          <li key={l.id}>
            <a
              href={`#${l.id}`}
              className={active === l.id ? styles.active : undefined}
              aria-current={active === l.id ? 'true' : undefined}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
