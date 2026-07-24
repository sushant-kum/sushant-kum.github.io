# Immersive Animations — Batch 2 Design

**Date:** 2026-07-24
**Branch:** `feat/immersive-animations` (continues from batch 1)
**Status:** Approved (pending spec review)

## Goal

Add eight more animations on top of the batch-1 motion layer, deepening the
"living neon terminal" feel while preserving every existing guarantee: SSG
prerender, WCAG AA accessibility, `prefers-reduced-motion` parity (each effect
degrades to a static/calm equivalent), fast first paint, and data-driven content.

## Guiding principles (unchanged from batch 1)

- One cohesive identity; effects reuse the existing cursor/particle/scroll system.
- Progressive enhancement: server renders static, accessible content; motion is
  layered on the client behind capability + preference guards.
- No fabricated content. Skill "meters" are decorative (no scores); stats are
  honest figures derived from real data.
- GSAP only via `src/lib/gsap.ts` (SplitText registered there); Three only via
  `src/lib/three.ts`. Each new unit ships an `axe` test.

## New content (data-driven)

`src/data/stats.ts` — a small "by the numbers" strip, editable like other data:

```ts
export type Stat = { value: number; suffix?: string; label: string };
export const stats: Stat[] = [
  { value: 7, suffix: '+', label: 'years shipping' },
  { value: 4, label: 'companies' },
  { value: 4, label: 'featured projects' },
  { value: 14, label: 'technologies' },
];
```

Figures: 7+ years (full-time SWE since May 2019), 4 companies (experience data),
4 featured projects (projects data), 14 technologies (skills data). Values are
plain data; count-up animates `0 → value`.

## The eight features

### 1. Boot-sequence preloader (`src/components/Preloader/`)

Full-screen terminal overlay shown on **every load**. A few typed lines
(`$ initializing sushantk.dev…`, etc.), then a wipe-up reveal of the page.

- **No-JS / JS-error safe:** the overlay auto-dismisses via a pure CSS keyframe
  animation (opacity→0 + `pointer-events:none` + `visibility:hidden` at the end),
  so content is never permanently covered if JS fails. JS enhances with the
  typing effect and an explicit early dismiss.
- **Skippable:** click or `Esc` dismisses immediately; the overlay never traps
  focus and is `aria-hidden="true"` (decorative; real content already in DOM).
- **Reduced-motion:** overlay is hidden immediately (no typing, no delay) via
  `@media (prefers-reduced-motion: reduce)`.
- **Scroll lock:** while visible, `overflow:hidden` on the overlay only; released
  on dismiss. Mounted as the first child of `App`.
- **SSG:** static markup renders server-side; the CSS animation runs on load. JS
  typing is client-only and guarded.

### 2. Hero name reveal + shimmer

- Register GSAP **SplitText** in `src/lib/gsap.ts` (now free) behind the existing
  `typeof window` guard.
- On load, split `profile.name` into characters and stagger a rise/fade-in
  (inside the existing hero reduced-motion matchMedia block, sequenced before/with
  the existing reveal timing).
- A slow, looping gradient **shimmer** sweeps across the name's existing
  gradient-text fill (animate `background-position`).
- **Reduced-motion:** the name renders statically (SplitText not applied, no
  shimmer). SplitText must revert cleanly on cleanup so the DOM text is intact for
  screen readers / re-renders.

### 3. Project card glare (`useGlare`, folded into `ProjectCard`)

- On pointer move over a card, drive a radial highlight layer (`::after` or a
  child span) toward the cursor, plus a subtly rotating gradient border.
- Layers on top of the existing `useTilt`; shares the same pointer handler where
  practical.
- **Guards:** `pointer: fine` + motion allowed only; resets on leave.
- **a11y:** glare layer is `aria-hidden`/decorative; card content unchanged.

### 4. Stat count-up (`StatStrip` + `useCountUp`)

- `useCountUp(ref, target, { suffix })` animates `0 → target` when the element
  scrolls into view (ScrollTrigger `onEnter`, once), writing `textContent`.
- `StatStrip` renders `stats` as a row; placed in About beneath the facts.
- **SSG/a11y:** the final value + label render in JSX (real text for SSG/screen
  readers); the hook animates from 0 only as an enhancement.
- **Reduced-motion:** final numbers shown immediately (no count).

### 5. Nav sliding indicator

- A neon pill/underline element positioned under the active nav link. On active
  section change, measure the active `<a>`'s offset/width and animate the
  indicator (`gsap.to` x/width). Recompute on resize.
- **Nav hide/show:** hide on scroll-down, show on scroll-up (transform the nav
  off-canvas), via ScrollTrigger velocity/direction.
- **Reduced-motion:** no sliding (indicator snaps or is static under the active
  link); nav stays visible (no hide/show).
- **a11y:** indicator is decorative `aria-hidden`; `aria-current` (from batch 1)
  remains the semantic signal; keyboard focus unaffected.

### 6. Skill fill sweep

- Each skill chip gets a decorative neon fill/scan that sweeps across on
  scroll-in (staggered per group). Implemented via a pseudo-element gradient whose
  position/opacity is animated (scrub or once). No numeric level implied.
- **Reduced-motion:** chips render in their normal static state.

### 7. Scroll-velocity skew (`useScrollSkew`)

- A single global effect reads scroll velocity (ScrollTrigger) and applies a
  small, clamped `skewY`/`translateY` to a wrapper (e.g. `#main` content groups),
  easing back to 0 when scrolling stops. Transform-only; magnitude capped (≈±4°).
- **Reduced-motion / SSR:** disabled entirely.
- **Perf:** one rAF-throttled updater; no layout reads in the hot path.

### 8. Cursor context labels + scroll-reactive particles

- **CursorGlow:** when hovering an element with `data-cursor="<label>"` (e.g.
  project cards → "view", external links → "open"), render that label inside/next
  to the ring; clear on leave. Extends the existing `interactive`/hover logic.
- **ParticleHero:** the ambient field's drift speed/rotation responds to scroll
  velocity (read via a shared scroll signal or ScrollTrigger), adding liveliness
  as the user scrolls; clamped so it stays subtle.
- **Reduced-motion:** labels and scroll-reactivity both disabled (batch-1
  behavior).

## Architecture / file map

New:

- `src/data/stats.ts`
- `src/components/Preloader/{Preloader.tsx,.module.scss,.test.tsx}`
- `src/components/StatStrip/{StatStrip.tsx,.module.scss,.test.tsx}`
- `src/hooks/useCountUp.ts` (+ test)
- `src/hooks/useGlare.ts` (+ test)
- `src/hooks/useScrollSkew.ts` (+ test)

Modified:

- `src/lib/gsap.ts` (register + re-export SplitText)
- `src/App.tsx` (mount Preloader first; wrap main for skew)
- `src/sections/Hero/Hero.tsx` (SplitText name reveal + shimmer)
- `src/sections/Hero/Hero.module.scss` (shimmer keyframes)
- `src/sections/Projects/Projects.tsx` + `.module.scss` (glare, `data-cursor`)
- `src/sections/About/About.tsx` (mount StatStrip)
- `src/sections/Skills/Skills.tsx` + `.module.scss` (fill sweep)
- `src/components/Nav/Nav.tsx` + `.module.scss` (sliding indicator + hide/show)
- `src/components/CursorGlow/CursorGlow.tsx` + `.module.scss` (context labels)

## Testing

- Vitest + Testing Library + jest-axe; GSAP/ScrollTrigger/matchMedia already
  mocked. Add `SplitText` to the gsap mock (a no-op returning `{ revert(){} }`).
- Each new component/hook: renders its accessible container, decorative layers
  `aria-hidden`, passes `axe`; hooks tested via a host component. Count-up and
  skill/stat text assert the final (real) values render (mock never fires the
  ScrollTrigger enter, so enhancements are inert in jsdom).
- Existing suites stay green (Nav still renders 5 links; About still renders
  facts; Projects still renders titles/tech). CI gate unchanged.

## Delivery plan

Phased commits on `feat/immersive-animations`:

1. Foundation: SplitText registration + gsap mock; `stats.ts`.
2. Preloader.
3. Hero name reveal + shimmer.
4. Stat count-up (`useCountUp` + `StatStrip` in About).
5. Project card glare (`useGlare`).
6. Skill fill sweep.
7. Nav sliding indicator + hide/show.
8. Scroll-velocity skew (`useScrollSkew`).
9. Cursor context labels + scroll-reactive particles.
10. Verify (CI + build + code-split + reduced-motion), final review, done.

## Out of scope

- Light theme / theme toggle (site is deliberately dark).
- Sound. Routing/page transitions (single page).
- Changing existing copy beyond adding `stats.ts` content.

## Risks & mitigations

- **Preloader hiding content on JS failure** → pure-CSS auto-dismiss is the
  source of truth; JS only enhances.
- **SplitText DOM mutation vs. SSG/screen readers** → apply on client only, revert
  on cleanup; the semantic `<h1>` text is authored in JSX and restored.
- **Scroll-skew jank** → transform-only, clamped, rAF-throttled, reduced-motion off.
- **Stat honesty** → figures derived from real data and labeled accurately;
  "featured projects" not "projects shipped".
- **Preloader on every load annoyance** → kept short (~1.2s) and skippable; this
  was an explicit user choice.
