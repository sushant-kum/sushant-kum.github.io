import { useRef } from 'react';

import styles from './Experience.module.scss';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { experience } from '../../data/experience';
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap';

export const Experience = () => {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.item}`, {
          opacity: 0,
          x: -20,
          duration: 0.5,
          ease: 'expo.out',
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: 'top 70%' },
        });
        gsap.from(`.${styles.line}`, {
          scaleY: 0,
          transformOrigin: 'top',
          duration: 1,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 70%' },
        });
      });
      return () => {
        mm.revert();
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    },
    { scope: root },
  );

  return (
    <section id="experience" ref={root} className={styles.exp}>
      <div className={styles.inner}>
        <SectionHeading id="experience-h" title="Experience" eyebrow="// career --log" />
        <div className={styles.timeline}>
          <span className={styles.line} aria-hidden="true" />
          <ol className={styles.list}>
            {experience.map((c) => (
              <li key={c.company} className={styles.item}>
                <span className={styles.dot} aria-hidden="true" />
                <h3 className={styles.company}>{c.company}</h3>
                <ul className={styles.roles}>
                  {c.roles.map((r) => (
                    <li key={r.title + r.period}>
                      <span className={styles.title}>{r.title}</span>
                      <span className={styles.period}>
                        {r.period}
                        {r.duration && ` · ${r.duration}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};
