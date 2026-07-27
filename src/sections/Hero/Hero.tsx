import { MapPin } from 'lucide-react';
import { useRef, useState } from 'react';

import styles from './Hero.module.scss';
import { Chip } from '../../components/Chip/Chip';
import { GlowBackground } from '../../components/GlowBackground/GlowBackground';
import { ParticleHero } from '../../components/ParticleHero/ParticleHero';
import { profile } from '../../data/profile';
import { useGSAP, gsap } from '../../lib/gsap';

const PHRASES = [
  'building interfaces for the web',
  'shipping full-stack products',
  'Angular · React · TypeScript',
];
const CHIPS = ['TypeScript', 'Angular', 'React', 'Node.js', 'Express', 'Redux'];

export const Hero = () => {
  const root = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const [typed, setTyped] = useState(PHRASES[0]);

  useGSAP(
    () => {
      const nameEl = nameRef.current;
      const chars = nameEl
        ? Array.from(nameEl.querySelectorAll<HTMLElement>(`.${styles.char}`))
        : [];

      // One continuous gradient across the whole name: size a single gradient to
      // the rendered text width and offset each character into it, instead of
      // each letter repeating its own gradient. Runs for every client (this is
      // static positioning, not motion), so reduced-motion users get it too.
      const paintGradient = (sweep = 0) => {
        if (chars.length === 0) return;
        const last = chars[chars.length - 1];
        const width = last.offsetLeft + last.offsetWidth || 1;
        const gradWidth = width * 1.6;
        const base = -(gradWidth - width) / 2;
        chars.forEach((c) => {
          c.style.backgroundSize = `${gradWidth}px 100%`;
          c.style.backgroundPositionX = `${base - c.offsetLeft + sweep}px`;
        });
      };
      paintGradient();
      const onResize = () => paintGradient();
      window.addEventListener('resize', onResize);

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Per-character reveal of the name. The chars are real JSX <span>s (React
        // owns them), so the frequent typewriter re-renders never fight the
        // animation the way a runtime DOM-splitter (SplitText) would.
        gsap.from(chars, {
          yPercent: 120,
          opacity: 0,
          ease: 'expo.out',
          duration: 0.9,
          stagger: 0.03,
          delay: 3.4,
        });
        gsap.from(`.${styles.reveal}`, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: 'expo.out',
          stagger: 0.08,
          delay: 3.4,
        });
        gsap.to(`.${styles.inner}`, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true },
        });
        // Shimmer: sweep the shared gradient back and forth across the name.
        const sweep = { v: 0 };
        const shimmer = gsap.to(sweep, {
          v: 1,
          duration: 3.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          onUpdate: () => {
            const last = chars[chars.length - 1];
            const width = last ? last.offsetLeft + last.offsetWidth : 0;
            paintGradient((sweep.v - 0.5) * width * 0.5);
          },
        });
        // typewriter loop — track the latest scheduled call so cleanup can kill it
        let pi = 0,
          ci = 0,
          del = false,
          active = true;
        let call: ReturnType<typeof gsap.delayedCall> | null = null;
        const tick = () => {
          if (!active) return;
          const w = PHRASES[pi];
          setTyped(w.slice(0, ci));
          if (!del) {
            ci++;
            if (ci > w.length) {
              del = true;
              call = gsap.delayedCall(1.4, tick);
              return;
            }
          } else {
            ci--;
            if (ci === 0) {
              del = false;
              pi = (pi + 1) % PHRASES.length;
            }
          }
          call = gsap.delayedCall(del ? 0.036 : 0.064, tick);
        };
        call = gsap.delayedCall(0.8, tick);
        return () => {
          active = false;
          call?.kill();
          shimmer.kill();
        };
      });
      return () => {
        window.removeEventListener('resize', onResize);
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section id="top" ref={root} className={styles.hero}>
      <GlowBackground />
      <ParticleHero />
      <div className={styles.inner}>
        <p className={`${styles.kicker} ${styles.reveal}`}>{`// ${profile.role.toLowerCase()}`}</p>
        <h1 ref={nameRef} className={styles.name} aria-label={profile.name}>
          {[...profile.name].map((ch, i) => (
            <span key={i} className={styles.char} aria-hidden="true">
              {ch}
            </span>
          ))}
        </h1>
        <p className={`${styles.term} ${styles.reveal}`}>
          <span className={styles.prompt}>sushant@dev</span> <span className={styles.tilde}>~</span>{' '}
          % <span>{typed}</span>
          <span className={styles.cursor} aria-hidden="true">
            _
          </span>
        </p>
        <div className={`${styles.chips} ${styles.reveal}`}>
          {CHIPS.map((c) => (
            <Chip key={c} magnetic>
              {c}
            </Chip>
          ))}
        </div>
        <p className={`${styles.meta} ${styles.reveal}`}>
          <span>
            <MapPin size={14} /> {profile.location}
          </span>
        </p>
      </div>
    </section>
  );
};
