import { useRef } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap'
import { SectionHeading } from '../../components/SectionHeading/SectionHeading'
import { profile } from '../../data/profile'
import avatar from '../../assets/avatar.jpg'
import styles from './About.module.scss'

export function About() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.animate}`, {
        opacity: 0, y: 24, duration: 0.6, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 75%' },
      })
    })
    return () => { mm.revert(); ScrollTrigger.getAll().forEach((t) => t.kill()) }
  }, { scope: root })

  return (
    <section id="about" ref={root} className={styles.about}>
      <div className={styles.inner}>
        <SectionHeading id="about-h" title="About" eyebrow="// whoami" />
        <div className={styles.grid}>
          <img className={`${styles.avatar} ${styles.animate}`} src={avatar}
               width={160} height={160} alt="Sushant Kumar" loading="lazy" />
          <div className={styles.body}>
            {profile.bioParagraphs.map((p, i) => (
              <p key={i} className={styles.animate}>{p}</p>
            ))}
            <dl className={`${styles.facts} ${styles.animate}`}>
              {profile.quickFacts.map((f) => (
                <div key={f.label} className={styles.fact}>
                  <dt>{f.label}</dt><dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
