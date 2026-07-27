import { useEffect, type RefObject } from 'react';

import { gsap, ScrollTrigger } from '../lib/gsap';

/** Count 0 → target when the element scrolls into view. Static under reduced motion. */
export const useCountUp = (
  ref: RefObject<HTMLElement | null>,
  target: number,
  opts: { suffix?: string; duration?: number } = {},
) => {
  const suffix = opts.suffix ?? '';
  const duration = opts.duration ?? 1.4;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = `${target}${suffix}`;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const counter = { v: 0 };
    let tween: ReturnType<typeof gsap.to> | null = null;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        tween = gsap.to(counter, {
          v: target,
          duration,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${Math.round(counter.v)}${suffix}`;
          },
        });
      },
    });
    return () => {
      tween?.kill?.();
      st.kill?.();
    };
  }, [ref, target, suffix, duration]);
};
