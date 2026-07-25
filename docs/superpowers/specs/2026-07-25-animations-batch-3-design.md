# Immersive Animations — Batch 3 Design

**Date:** 2026-07-25
**Branch:** `feat/immersive-animations` (continues from batches 1–2)
**Status:** Approved in concept (live demos picked); pending spec review

## Goal

Add the four effects the user selected from the live demos, preserving every
existing guarantee (SSG, WCAG AA, `prefers-reduced-motion` parity, code-split
Three.js, fast first paint):

1. **Bloom** on the hero particle field (Three.js post-processing, auto-scaling).
2. **Hero-scoped scroll fly-through** of the particle field.
3. **Experience timeline** motion (scroll-drawn line, activating dots, active highlight).
4. **Avatar duotone + hover glitch** and a global **cursor spotlight**.

Effects 1 + 2 are one coherent rework of `ParticleHero`.

## Decisions (locked)

| Decision              | Choice                                                                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fly-through scope     | Hero-scoped: fly forward through the field as you scroll out of the hero (not a full-page fixed field)                                                                    |
| Bloom on weak devices | Auto-scale: full bloom on capable devices; fall back to the current additive glow on mobile / low-capability / hidden tab                                                 |
| Avatar source         | Existing `src/assets/avatar.jpg`                                                                                                                                          |
| Bloom transparency    | Bloom path renders the hero canvas **opaque** (page bg `#020617`) to avoid EffectComposer alpha artifacts; the non-bloom fallback stays transparent over `GlowBackground` |

## Honesty / verification note

Bloom and the fly-through are WebGL and **cannot be verified in the headless
test environment** (jsdom has no WebGL; `ParticleHero` bails there). They will be
built to spec and must be **visually confirmed by the user** in `pnpm preview`.
The build sequences these first so they can be checked before the rest.

## Pillar 1+2 — `ParticleHero`: bloom + scroll fly-through

**File:** `src/components/ParticleHero/ParticleHero.tsx` (+ `src/lib/three.ts`).

### Bloom (auto-scale)

- Add `loadThreeFX()` to `src/lib/three.ts`: window-guarded, cached dynamic
  import of the Three addons `EffectComposer`, `RenderPass`, `UnrealBloomPass`,
  `OutputPass` from `three/addons/postprocessing/*`. Returns `null` during SSG.
- **Capability gate** (compute once): `bloomCapable = matchMedia('(min-width: 900px)').matches && matchMedia('(pointer: fine)').matches && (devicePixelRatio || 1) <= 2.5`.
- If capable: build an `EffectComposer(renderer)` with `RenderPass` +
  `UnrealBloomPass(new Vector2(w,h), strength≈0.9, radius≈0.5, threshold≈0.0)` +
  `OutputPass()`; render loop calls `composer.render()`; set
  `renderer.setClearColor(0x020617, 1)` (opaque) so bloom composites cleanly.
  On resize, `composer.setSize(w,h)` + `bloomPass.setSize(w,h)`. Dispose composer
  on cleanup.
- If not capable (or `loadThreeFX()` fails): keep the current path — transparent
  canvas + additive `PointsMaterial`, `renderer.render(scene, camera)`.
- Either way the additive `PointsMaterial` stays (bloom stacks on it nicely).

### Scroll fly-through (hero-scoped)

- Replace the batch-2 `scrollBoost` rotation hack with a camera **z-travel** tied
  to hero scroll: each frame compute `p = clamp(scrollY / (heroHeight * 0.9), 0, 1)`
  (`heroHeight` = hero `clientHeight`, recomputed on resize), then ease
  `camera.position.z` toward `26 - p * 34` (`camera.z += (target - camera.z) * 0.08`).
  Camera flies forward through the cloud (particles span z ≈ ±19) as you scroll
  out of the hero — a cinematic exit. Keep the gentle ambient `rotation.y`.
- Particles that pass behind the near plane simply disappear (fly past) — no
  wrap needed for the hero-scoped range.
- **Reduced-motion:** `ParticleHero` is not mounted at all (unchanged), so both
  effects are absent; `GlowBackground` + static hero text remain.

## Pillar 3 — Experience timeline motion

**Files:** `src/sections/Experience/Experience.tsx` + `.module.scss`.

- **Line draw:** change the `.line` reveal to scrub-linked so the connector line
  fills as you scroll through the section (`scrollTrigger: { trigger: root, start:'top 75%', end:'bottom 60%', scrub: true }`, `transformOrigin: top`).
- **Activating dots + active company:** add a per-item `ScrollTrigger` (via a
  gsap tween's `scrollTrigger` with `toggleClass`) that toggles an `active` class
  on each `.item` as it reaches center. CSS: `.item.active .dot` fills solid cyan
  and pulses (keyframe), `.item.active .company` brightens to `$ink`/glows.
- Keep the existing `scrubReveal` item slide-in.
- **Reduced-motion:** the motion block is skipped, so the **default CSS is the
  resting state** — line full (`scaleY: 1`), dots in their current cyan-outline
  style, companies normal. No `active` pulsing. (Matches today's static look.)
- Re-import `ScrollTrigger` in this file (removed last round) for the per-item
  triggers; cleanup stays `mm.revert()` (no `getAll().kill()`), which reverts the
  matchMedia context's triggers and the toggled classes.

## Pillar 4a — About avatar duotone + hover glitch (CSS-only)

**Files:** `src/sections/About/About.tsx` + `.module.scss`.

- Wrap the avatar `<img>` in a `<figure className={styles.avatar}>` (keep the
  `<img alt="Sushant Kumar">` for a11y/SSG; keep `.animate` on the figure).
- **Duotone:** `img { filter: grayscale(1) contrast(1.05); }` + `.avatar::after`
  gradient `linear-gradient(140deg, cyan, violet)` with `mix-blend-mode: color`
  (tints the greyscale to neon) + a faint `screen` highlight. Neon edge via the
  existing border + cyan glow.
- **Hover glitch (RGB-split):** `.avatar:hover img` runs a short `glitch`
  keyframe using `clip-path` slice insets + `drop-shadow(cyan)` / `drop-shadow(violet)`
  offsets + small `translate` — a canonical CSS glitch, no JS.
- **Reduced-motion:** `@media (prefers-reduced-motion: reduce)` disables the
  glitch animation; the static duotone remains.
- No new dependencies, no WebGL — fully testable/SSG-safe.

## Pillar 4b — Cursor spotlight (global `Spotlight`)

**Files:** new `src/components/Spotlight/{Spotlight.tsx,.module.scss,.test.tsx}`;
mount in `src/App.tsx`.

- Fixed, full-viewport, `aria-hidden`, `pointer-events: none` layer whose
  `background: radial-gradient(circle at var(--x) var(--y), rgba(cyan, ~0.06), transparent 40%)`
  with `mix-blend-mode: screen` gently lifts content under the cursor.
- A client effect updates `--x`/`--y` from the pointer, **eased** via a small rAF
  lerp (trailing feel); listeners + rAF cleaned up on unmount.
- **Guards:** only initialized on `matchMedia('(pointer: fine)')` and not
  reduced-motion; CSS hides it under `@media (pointer: coarse)` and
  `(prefers-reduced-motion: reduce)`. GSAP not required (plain CSS var updates).
- Mounted alongside `CursorGlow` in `App` (below it in z-order); the two coexist
  (small dot/ring + large soft light).

## Architecture / file map

New:

- `src/components/Spotlight/{Spotlight.tsx,.module.scss,.test.tsx}`

Modified:

- `src/lib/three.ts` (add `loadThreeFX`)
- `src/components/ParticleHero/ParticleHero.tsx` (bloom + fly-through)
- `src/sections/Experience/Experience.tsx` + `.module.scss`
- `src/sections/About/About.tsx` + `.module.scss`
- `src/App.tsx` (mount `Spotlight`)

## Testing

- Vitest + Testing Library + jest-axe. `ParticleHero` continues to bail in jsdom
  (no 2D context) → bloom/fly-through code never runs in tests; its test is
  unchanged (renders `aria-hidden` container, axe). No `three/addons` mock needed
  because that path isn't reached in tests.
- `Spotlight`: renders an `aria-hidden` layer; effect no-ops under jsdom
  `matchMedia` (matches:false); axe passes.
- `Experience` / `About`: content still renders (companies, roles, bio, avatar
  `alt`); gsap/ScrollTrigger mocked so the timeline motion is inert; existing
  tests stay green. Add/keep an axe check where markup changed.
- `loadThreeFX`: only the SSG (`window` undefined → `null`) branch is unit-tested;
  the real addon import is not exercised in jsdom.
- CI gate unchanged.

## Delivery plan (phased commits on the branch)

1. `loadThreeFX` in `three.ts` (+ SSG-null test).
2. `ParticleHero` bloom (auto-scale, opaque clear on bloom path).
3. `ParticleHero` scroll fly-through (camera z-travel; replaces `scrollBoost`).
4. Experience timeline motion.
5. About avatar duotone + hover glitch.
6. `Spotlight` component + mount in `App`.
7. Verify (CI + build + code-split), **user visual check of the hero**, final review.

## Out of scope

- Full-page fixed particle field (explicitly deferred — hero-scoped chosen).
- Any change to copy or `src/data/*`.
- Making project cards clickable (separate, pending URLs).

## Risks & mitigations

- **Bloom transparency artifacts** → bloom path uses an opaque clear color; the
  hero grid/blobs sit behind it on capable devices (intentional), and the
  transparent additive fallback keeps them on other devices.
- **Bloom/fly-through unverifiable headlessly** → build first, gate on user
  visual confirmation before the rest; additive fallback guarantees a working
  baseline.
- **Perf (bloom + WebGL)** → auto-scale off on mobile/low-DPR; paused off-screen
  and on hidden tab (existing); DPR capped.
- **Spotlight hurting legibility** → very low alpha + `screen` blend + tight
  falloff; off on touch/reduced-motion.
- **Over-animation** → spotlight is subtle; timeline/avatar are section-local;
  reduced-motion path stays the calm site.
