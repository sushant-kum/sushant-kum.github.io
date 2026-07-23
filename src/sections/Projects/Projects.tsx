import { useRef } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap'
import { SectionHeading } from '../../components/SectionHeading/SectionHeading'
import { Chip } from '../../components/Chip/Chip'
import { projects } from '../../data/projects'
import styles from './Projects.module.scss'

export function Projects() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.card}`, {
        opacity: 0, y: 24, scale: 0.96, duration: 0.5, ease: 'back.out(1.4)', stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: 'top 75%' },
      })
    })
    return () => { mm.revert(); ScrollTrigger.getAll().forEach((t) => t.kill()) }
  }, { scope: root })

  return (
    <section id="projects" ref={root} className={styles.projects}>
      <div className={styles.inner}>
        <SectionHeading id="projects-h" title="Projects" eyebrow="// selected work" />
        <ul className={styles.grid}>
          {projects.map((p) => (
            <li key={p.title} className={styles.card}>
              <h3 className={styles.title}>{p.title}</h3>
              <p className={styles.blurb}>{p.blurb}</p>
              <div className={styles.tech}>
                {p.tech.map((t) => <Chip key={t} variant="violet">{t}</Chip>)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
