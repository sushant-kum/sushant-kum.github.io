import { useRef, useSyncExternalStore } from 'react';

import styles from './Contact.module.scss';
import { SocialLinks } from '../../components/SocialLinks/SocialLinks';
import { profile } from '../../data/profile';
import { useScramble } from '../../hooks/useScramble';
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap';

// The copyright year reads the client's live year, but falls back to the
// build-time year on the server so SSG output and hydration match exactly.
const subscribeYear = () => () => {};
const getClientYear = () => new Date().getFullYear();
const getBuildYear = () => __BUILD_YEAR__;

export const Contact = () => {
  const root = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const year = useSyncExternalStore(subscribeYear, getClientYear, getBuildYear);
  useScramble(eyebrowRef, '// get in touch');
  useScramble(titleRef, "Let's build something.");
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.animate}`, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: 'top 80%' },
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
    <footer id="contact" ref={root} className={styles.contact}>
      <div className={styles.inner}>
        <p ref={eyebrowRef} className={`${styles.eyebrow} ${styles.animate}`}>
          &#47;&#47; get in touch
        </p>
        <h2 ref={titleRef} className={`${styles.title} ${styles.animate}`}>
          Let&apos;s build something.
        </h2>
        <p className={`${styles.sub} ${styles.animate}`}>
          Open to conversations about full-stack product engineering — say hello.
        </p>
        <div className={styles.animate}>
          <SocialLinks />
        </div>
        <p className={`${styles.copy} ${styles.animate}`}>
          © {year} {profile.name} · Bengaluru, India
        </p>
      </div>
    </footer>
  );
};
