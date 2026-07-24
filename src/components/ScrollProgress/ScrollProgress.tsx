import { useEffect, useRef } from 'react';

import styles from './ScrollProgress.module.scss';
import { gsap, ScrollTrigger } from '../../lib/gsap';

export const ScrollProgress = () => {
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = fill.current;
    if (!el) return;
    const vertical = window.matchMedia('(min-width: 769px)').matches;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self: { progress: number }) => {
        gsap.set(el, vertical ? { scaleY: self.progress } : { scaleX: self.progress });
      },
    });
    return () => st.kill?.();
  }, []);

  return (
    <div className={styles.rail} aria-hidden="true">
      <div ref={fill} className={styles.fill} />
    </div>
  );
};
