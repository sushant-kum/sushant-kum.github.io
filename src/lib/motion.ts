import { gsap } from './gsap';

/** Scrub-linked reveal: targets fade + slide in tied to scroll position. */
export const scrubReveal = (
  targets: gsap.TweenTarget,
  trigger: Element | null,
  vars: gsap.TweenVars = {},
) =>
  gsap.from(targets, {
    opacity: 0,
    y: 24,
    ease: 'none',
    stagger: 0.08,
    ...vars,
    scrollTrigger: {
      trigger: trigger ?? undefined,
      start: 'top 80%',
      end: 'top 45%',
      scrub: true,
    },
  });
