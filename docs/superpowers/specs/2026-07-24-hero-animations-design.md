# Immersive Animations — Design

**Date:** 2026-07-24
**Branch:** `feat/immersive-animations`
**Status:** Approved (pending spec review)

## Goal

Make sushantk.dev feel "stunning and jaw-dropping" by adding a cohesive layer of
motion across four pillars — a Three.js particle hero, a custom cursor, scroll
storytelling, and micro-interactions — without regressing the site's existing
guarantees: SSG prerender, WCAG AA accessibility, `prefers-reduced-motion`
support, and fast first paint.

## Guiding principles

- **One identity, threaded through.** A single particle system + a single cursor
  identity (cyan→violet neon) recur across the page so it reads as one designed
  system, not scattered effects.
- **Progressive enhancement.** The server renders today's static, accessible
  site. Motion is layered on the client, behind capability + preference guards.
  Under `prefers-reduced-motion: reduce`, the site is visually identical to
  today (static hero text, no cursor, plain fade reveals).
- **GPU-cheap and pausable.** Effects prefer transforms/opacity; the Three.js
  scene is lazy-loaded, DPR-capped, and paused when off-screen or the tab is
  hidden.
- **Accessibility is non-negotiable.** All decorative canvas/cursor layers are
  `aria-hidden`. Keyboard navigation and focus states are untouched. Every new
  component ships a test including a `jest-axe` no-violations check.
- **Content stays data-driven.** No changes to `src/data/*`. Copy is unchanged.

## Decisions (locked)

| Decision         | Choice                                                              |
| ---------------- | ------------------------------------------------------------------- |
| 3D library       | Three.js (lazy-loaded)                                              |
| Hero centerpiece | Particle text-morph                                                 |
| Hero composition | Reveal → ambient: assemble "SK" → hold → disperse to drifting field |
| Projects scroll  | Vertical layout + 3D hover-tilt (no horizontal pin)                 |
| Delivery         | One feature branch, phased commits, single PR                       |

## Architecture

Each effect is an isolated, co-located unit following existing repo conventions
(folder per component: `Name.tsx`, `Name.module.scss`, `Name.test.tsx`; hooks in
`src/lib` or co-located). All GSAP usage imports from `src/lib/gsap.ts`. Three.js
is centralized in a new `src/lib/three.ts` mirroring the SSG-guard pattern of
`gsap.ts`.

New units:

- `src/lib/three.ts` — dynamic-import + `typeof window` guarded re-export of the
  minimal Three.js surface used (Scene, PerspectiveCamera, WebGLRenderer,
  BufferGeometry, Points, ShaderMaterial). Keeps Three out of the initial bundle.
- `src/components/ParticleHero/` — the Three.js canvas + particle system.
- `src/components/CursorGlow/` — custom trailing cursor + magnetic hover.
- `src/components/ScrollProgress/` — scroll progress rail synced to sections.
- `src/hooks/useScramble.ts` — text scramble/decode-in effect.
- `src/hooks/useMagnetic.ts` — magnetic pull for interactive elements.
- `src/hooks/useTilt.ts` — 3D tilt-toward-cursor for cards.

Touched existing units: `Hero` (mount `ParticleHero`, keep DOM text as the
accessible layer), `App` (mount `CursorGlow` + `ScrollProgress` globally),
section headings (scramble), `Skills`/`Hero` chips (magnetic), `Projects` cards
(tilt), section reveals (scrub-linked). `GlowBackground` is retained as the
static/reduced-motion fallback backdrop.

## Pillar 1 — Particle hero (Three.js)

**Component:** `ParticleHero`, mounted inside `Hero` behind the existing text.

- Three.js `Points`, ~4–6k particles, color ramped cyan→violet by depth; additive
  blending for glow; subtle depth-of-field via size attenuation.
- **Target positions** for "SK" sampled once from an offscreen 2D canvas (render
  bold "SK", sample opaque pixels → 3D target buffer). Recomputed on significant
  resize.
- **Timeline (GSAP-driven uniforms/attributes):**
  1. `0–2.2s` particles fly in from random 3D positions and lerp toward "SK".
  2. `2.2–3.7s` hold as "SK".
  3. `3.7–5.0s` disperse: outward impulse → ambient drifting field.
  4. Ambient: slow rotation/drift + cursor repulsion, indefinite.
- **DOM hero text** (`<h1>`, typewriter, chips, meta) fades in `~3.6–4.6s` over
  the settled field. Text remains the real, accessible content; canvas is
  `aria-hidden`.
- **SSG safety:** Three.js dynamically imported inside an effect guarded by
  `typeof window !== 'undefined'`. Server output = current static hero.
- **Perf:** `WebGLRenderer` with capped DPR (≤2); render loop paused via
  IntersectionObserver when hero is off-screen and on `visibilitychange`;
  disposed on unmount.
- **Reduced-motion:** ParticleHero is not mounted; `GlowBackground` shows and
  hero text renders immediately (current behavior).

## Pillar 2 — Custom cursor (`CursorGlow`)

- Global component mounted in `App`. A soft cyan glow dot trails the pointer
  using GSAP `quickTo` for smooth lag; a thin outer ring follows more tightly.
- **Magnetic hover** (`useMagnetic`) on links, buttons, chips, social icons: ring
  expands, element is gently pulled toward the cursor and released on leave.
- **Guards:** only initialized when `matchMedia('(pointer: fine)')` matches;
  hidden on touch; the native cursor is never hidden for keyboard users / on
  focus. Entirely disabled under reduced-motion.
- `aria-hidden`; pointer-events: none; fixed-position layer above content.

## Pillar 3 — Scroll storytelling

- **`ScrollProgress`:** a thin neon rail (left edge on desktop, top on mobile)
  that fills with scroll position; segments/marker reflect the active section and
  stay in sync with `Nav`'s current-section state.
- **Parallax depth:** hero particle field + section eyebrows move at slightly
  different scroll rates (ScrollTrigger scrub) for depth. Small, tasteful offsets.
- **Scrub-linked reveals:** existing on/off `gsap.from` reveals become
  scrub-tied so they track scroll position both directions.
- **Eyebrow scramble:** section eyebrows (`// career --log`, etc.) scramble-decode
  as they enter the viewport.
- All wrapped in `matchMedia('(prefers-reduced-motion: no-preference)')`; reduced
  motion keeps today's simple fade-in reveals and hides the rail's animation
  (static or omitted).

## Pillar 4 — Micro-interactions

- **Text scramble** (`useScramble`): section headings + hero role decode on
  reveal. Respects reduced-motion (renders final text immediately).
- **Magnetic chips** (`useMagnetic`): Hero + Skills chips pull toward cursor with
  a soft glow-follow on hover.
- **Project card tilt** (`useTilt`): 3D tilt-toward-cursor + neon edge glow on
  hover; resets on leave; keyboard focus shows the glow without tilt.
- **Skill chips/bars:** staggered scrub-linked animate-in on scroll.

## Cross-cutting

- **Reduced motion:** single source of truth — every motion unit checks
  `matchMedia('(prefers-reduced-motion: no-preference)')` (JS) and effects also
  degrade in CSS via `@media (prefers-reduced-motion: reduce)`. Fallback == today.
- **Cleanup:** every `useGSAP`/effect reverts its `matchMedia`, kills its
  ScrollTriggers, and (ParticleHero) disposes the renderer/geometry/material.
- **Bundle:** Three.js is a lazy async chunk; initial JS payload is not blocked by
  it. Measure `dist/` chunk sizes before/after; Three chunk must be code-split.

## Testing

- Vitest + Testing Library + `jest-axe`. GSAP/ScrollTrigger/`matchMedia` already
  mocked in `src/test/setup.ts`; add a Three.js/WebGL mock so `ParticleHero`
  renders its container without a real GL context in jsdom.
- Each new component/hook ships a test asserting: it renders its accessible
  container, is `aria-hidden` where decorative, and passes `axe`. Hooks tested via
  a small host component.
- Existing section tests updated where markup changes (scramble/tilt wrappers)
  and kept green.
- CI gate unchanged: `typecheck`, `lint:error`, `stylelint:error`, `secretlint`,
  `test`.

## Delivery plan (phases on one branch)

1. **Foundation + Hero:** `src/lib/three.ts`, `ParticleHero`, wire into `Hero`,
   reduced-motion fallback, tests. (Commit)
2. **Custom cursor:** `CursorGlow` + `useMagnetic`, mount in `App`, apply to
   chips/links, tests. (Commit)
3. **Scroll storytelling:** `ScrollProgress`, scrub reveals, parallax, eyebrow
   scramble, tests. (Commit)
4. **Micro-interactions:** `useScramble` on headings, `useTilt` on project cards,
   skills stagger, tests. (Commit)
5. **Polish + PR:** perf pass (chunk sizes, pause-off-screen verification),
   full CI green, open PR.

## Out of scope

- Horizontal-scroll / pinned Projects gallery (explicitly deferred).
- Any change to site copy or `src/data/*`.
- Sound, page transitions/routing (single page), theme switching.

## Risks & mitigations

- **Three.js bundle weight** → code-split lazy chunk; never blocks first paint;
  reduced-motion users never download it (import gated behind the motion check).
- **jsdom lacks WebGL** → mock Three in test setup; assert DOM/a11y, not GL.
- **Hydration divergence** → canvas mounts client-only after hydration; DOM hero
  text is identical server/client.
- **Motion overload** → effects are subtle, staggered, and centrally gated; the
  reduced-motion path is the current calm site.
