import { useEffect, type RefObject } from 'react';

import { ScrollTrigger } from '../lib/gsap';

const GLYPHS = '!<>-_\\/[]{}—=+*^?#________';

/** Decode text from random glyphs when the element enters view. */
export const useScramble = (ref: RefObject<HTMLElement | null>, text: string) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || !text) return;
    el.textContent = text;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let interval: ReturnType<typeof setInterval> | null = null;
    const run = () => {
      let iteration = 0;
      if (interval) clearInterval(interval);
      interval = setInterval(() => {
        el.textContent = text
          .split('')
          .map((ch, i) => {
            if (ch === ' ') return ' ';
            if (i < iteration) return text[i];
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join('');
        iteration += 1 / 3;
        if (iteration >= text.length) {
          if (interval) clearInterval(interval);
          el.textContent = text;
        }
      }, 40);
    };

    const st = ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: run });
    return () => {
      if (interval) clearInterval(interval);
      st.kill?.();
    };
  }, [ref, text]);
};
