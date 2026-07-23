import { useRef } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap'
import { SocialLinks } from '../../components/SocialLinks/SocialLinks'
import { profile } from '../../data/profile'
import styles from './Contact.module.scss'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.animate}`, {
        opacity: 0, y: 24, duration: 0.6, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 80%' },
      })
    })
    return () => { mm.revert(); ScrollTrigger.getAll().forEach((t) => t.kill()) }
  }, { scope: root })

  return (
    <footer id="contact" ref={root} className={styles.contact}>
      <div className={styles.inner}>
        <p className={`${styles.eyebrow} ${styles.animate}`}>// get in touch</p>
        <h2 className={`${styles.title} ${styles.animate}`}>Let’s build something.</h2>
        <p className={`${styles.sub} ${styles.animate}`}>
          Open to conversations about full-stack product engineering — say hello.
        </p>
        <div className={styles.animate}><SocialLinks /></div>
        <p className={`${styles.copy} ${styles.animate}`}>
          © {new Date().getFullYear()} {profile.name} · Bengaluru, India
        </p>
      </div>
    </footer>
  )
}
