import '@testing-library/jest-dom/vitest'
import { expect, vi } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// GSAP touches layout APIs jsdom lacks; no-op it in tests. Content renders regardless.
vi.mock('@gsap/react', () => ({ useGSAP: (_cb: () => void) => { /* skip effect */ } }))
vi.mock('gsap', () => {
  const tween = {}
  const gsap = {
    to: () => tween, from: () => tween, fromTo: () => tween, set: () => tween,
    timeline: () => ({ to: () => ({}), from: () => ({}), fromTo: () => ({}), add: () => ({}) }),
    registerPlugin: () => {},
    matchMedia: () => ({ add: () => {} }),
    context: () => ({ revert: () => {} }),
  }
  return { gsap, default: gsap }
})
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: () => ({}), refresh: () => {}, getAll: () => [] } }))

// jsdom lacks matchMedia
if (!window.matchMedia) {
  window.matchMedia = (q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  }) as unknown as MediaQueryList
}
