import { useRef } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap'
import { SectionHeading } from '../../components/SectionHeading/SectionHeading'
import { Chip } from '../../components/Chip/Chip'
import { skills } from '../../data/skills'
import styles from './Skills.module.scss'

export function Skills() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.group}`, {
        opacity: 0, y: 20, duration: 0.5, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 78%' },
      })
    })
    return () => { mm.revert(); ScrollTrigger.getAll().forEach((t) => t.kill()) }
  }, { scope: root })

  return (
    <section id="skills" ref={root} className={styles.skills}>
      <div className={styles.inner}>
        <SectionHeading id="skills-h" title="Skills" eyebrow="// stack" />
        <div className={styles.groups}>
          {skills.map((g) => (
            <div key={g.label} className={styles.group}>
              <h3 className={styles.label}>{g.label}</h3>
              <div className={styles.items}>
                {g.items.map((i) => <Chip key={i} variant="green">{i}</Chip>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
