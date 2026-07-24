import { useRef } from 'react';

import styles from './Skills.module.scss';
import { Chip } from '../../components/Chip/Chip';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { skills } from '../../data/skills';
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap';
import { scrubReveal } from '../../lib/motion';

export const Skills = () => {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        scrubReveal(`.${styles.group}`, root.current);
      });
      return () => {
        mm.revert();
        ScrollTrigger.getAll().forEach((t) => t.kill());
      };
    },
    { scope: root },
  );

  return (
    <section id="skills" ref={root} className={styles.skills}>
      <div className={styles.inner}>
        <SectionHeading id="skills-h" title="Skills" eyebrow="// stack" />
        <div className={styles.groups}>
          {skills.map((g) => (
            <div key={g.label} className={styles.group}>
              <h3 className={styles.label}>{g.label}</h3>
              <div className={styles.items}>
                {g.items.map((i) => (
                  <Chip key={i} variant="green" magnetic>
                    {i}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
