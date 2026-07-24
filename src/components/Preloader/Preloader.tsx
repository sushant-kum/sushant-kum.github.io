import { useEffect, useRef, useState } from 'react';

import styles from './Preloader.module.scss';

const LINES = ['$ initializing sushantk.dev', '$ loading modules … ok', '$ booting interface'];

export const Preloader = () => {
  const root = useRef<HTMLDivElement>(null);
  const out = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Already hidden via the .overlay reduced-motion media query — skip the
    // typing/early-skip enhancement entirely rather than setting state here.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const target = out.current;
    if (!target) return;

    let li = 0;
    let ci = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const type = () => {
      if (li >= LINES.length) return;
      const line = LINES[li];
      target.textContent = LINES.slice(0, li).join('\n') + (li ? '\n' : '') + line.slice(0, ci);
      ci += 1;
      if (ci > line.length) {
        li += 1;
        ci = 0;
        timers.push(setTimeout(type, 160));
      } else {
        timers.push(setTimeout(type, 34));
      }
    };
    timers.push(setTimeout(type, 120));

    const dismiss = () => setDismissed(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    const el = root.current;
    el?.addEventListener('click', dismiss);
    window.addEventListener('keydown', onKey);

    return () => {
      timers.forEach(clearTimeout);
      el?.removeEventListener('click', dismiss);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      ref={root}
      className={`${styles.overlay} ${dismissed ? styles.dismissed : ''}`}
      aria-hidden="true"
    >
      <div className={styles.term}>
        <div ref={out} className={styles.line} />
        <span className={styles.caret}>▍</span>
      </div>
    </div>
  );
};
