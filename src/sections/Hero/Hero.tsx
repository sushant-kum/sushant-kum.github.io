import { useRef, useState } from 'react'
import { useGSAP, gsap } from '../../lib/gsap'
import { GlowBackground } from '../../components/GlowBackground/GlowBackground'
import { Chip } from '../../components/Chip/Chip'
import { profile } from '../../data/profile'
import styles from './Hero.module.scss'

const PHRASES = ['building interfaces for the web', 'shipping full-stack products', 'Angular · React · TypeScript']
const CHIPS = ['TypeScript', 'Angular', 'React', 'Node.js', 'Express', 'Redux']

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const [typed, setTyped] = useState(PHRASES[0])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.reveal}`, {
        opacity: 0, y: 24, duration: 0.7, ease: 'expo.out', stagger: 0.08,
      })
      // typewriter loop
      let pi = 0, ci = 0, del = false
      const tick = () => {
        const w = PHRASES[pi]
        setTyped(w.slice(0, ci))
        if (!del) { ci++; if (ci > w.length) { del = true; return void gsap.delayedCall(1.4, tick) } }
        else { ci--; if (ci === 0) { del = false; pi = (pi + 1) % PHRASES.length } }
        gsap.delayedCall(del ? 0.036 : 0.064, tick)
      }
      const start = gsap.delayedCall(0.8, tick)
      return () => start.kill()
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section id="top" ref={root} className={styles.hero}>
      <GlowBackground />
      <div className={styles.inner}>
        <p className={`${styles.kicker} ${styles.reveal}`}>// {profile.role.toLowerCase()}</p>
        <h1 className={`${styles.name} ${styles.reveal}`}>{profile.name}</h1>
        <p className={`${styles.term} ${styles.reveal}`}>
          <span className={styles.prompt}>sushant@dev</span> <span className={styles.tilde}>~</span> %{' '}
          <span>{typed}</span><span className={styles.cursor} aria-hidden="true">_</span>
        </p>
        <div className={`${styles.chips} ${styles.reveal}`}>
          {CHIPS.map((c) => <Chip key={c}>{c}</Chip>)}
        </div>
        <p className={`${styles.meta} ${styles.reveal}`}>
          <span>📍 {profile.location}</span>
        </p>
      </div>
    </section>
  )
}
