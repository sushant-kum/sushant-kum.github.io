# Immersive Animations Batch 3 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bloom (auto-scale) + hero-scoped scroll fly-through on `ParticleHero`, Experience timeline motion, About avatar duotone+glitch, and a global cursor `Spotlight` — without regressing SSG/a11y/reduced-motion/first-paint.

**Architecture:** Effects 1+2 rework `ParticleHero` (Three.js). GSAP only via `src/lib/gsap.ts`; Three only via `src/lib/three.ts` (+ new `loadThreeFX`). Every effect gates on `prefers-reduced-motion` and, where pointer-driven, `pointer: fine`.

**Tech Stack:** Vite · React 19 · TypeScript · SCSS modules · GSAP · Three.js (+ postprocessing addons) · Vitest + Testing Library + jest-axe.

## Global Constraints

- Package manager **pnpm** — never npm/yarn.
- GSAP only via `src/lib/gsap.ts`; Three only via `src/lib/three.ts`.
- Every decorative layer `aria-hidden="true"` + `pointer-events: none` where it overlays content.
- Every new component ships a test with `expect(await axe(container)).toHaveNoViolations()`.
- Every motion effect skipped under `prefers-reduced-motion: reduce`; reduced-motion == the calm static site. Pointer effects also require `pointer: fine`.
- Bloom auto-scales: only on capable devices; opaque hero-canvas clear on the bloom path; transparent additive fallback otherwise.
- No changes to copy or `src/data/*`.
- CI gate green in order: `pnpm typecheck`, `lint:error`, `stylelint:error`, `secretlint`, `test`.
- Palette: bg `#020617`, cyan `#22d3ee`, violet `#a78bfa`, ink `#e6f0ff`, muted `#7c8aa8`, border `#1e2740`. Mixins: `respond-to`, `focus-ring`, `reduced-motion`, `glow-text`.
- Conventional Commits. Branch `feat/immersive-animations`.
- Test mocks (`src/test/setup.ts`): `gsap` (incl. `quickTo`, `delayedCall`), `gsap/ScrollTrigger` (`create()`→`{}`; guard `.kill?.()`), `matchMedia`→`matches:false`. jsdom never fires ScrollTrigger callbacks; `ParticleHero` bails (no 2D canvas context).

---

## Task 1: `loadThreeFX` in `src/lib/three.ts`

**Files:** Modify `src/lib/three.ts`; Test `src/lib/three.test.ts`.

**Interfaces:**

- Produces: `loadThreeFX(): Promise<ThreeFX> | null` — window-guarded, cached dynamic import of the postprocessing addons; `null` during SSG. `ThreeFX = { EffectComposer, RenderPass, UnrealBloomPass, OutputPass }`.

- [ ] **Step 1: Add a failing test for the SSG branch**

Append to `src/lib/three.test.ts` (inside a new describe, using `vi`):

```ts
import { describe, it, expect, vi } from 'vitest';

import { loadThree, loadThreeFX } from './three';
// ... keep existing loadThree tests ...

describe('loadThreeFX', () => {
  it('returns null during SSG when window is undefined', () => {
    vi.stubGlobal('window', undefined);
    try {
      expect(loadThreeFX()).toBeNull();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
```

(If the file already imports from vitest/`./three`, extend those imports rather than duplicating.)

- [ ] **Step 2: Run it, expect fail**

Run: `pnpm exec vitest run src/lib/three.test.ts`
Expected: FAIL — `loadThreeFX` not exported.

- [ ] **Step 3: Implement**

Append to `src/lib/three.ts`:

```ts
type PostFX = typeof import('three/examples/jsm/postprocessing/EffectComposer.js') &
  typeof import('three/examples/jsm/postprocessing/RenderPass.js') &
  typeof import('three/examples/jsm/postprocessing/UnrealBloomPass.js') &
  typeof import('three/examples/jsm/postprocessing/OutputPass.js');

export type ThreeFX = {
  EffectComposer: PostFX['EffectComposer'];
  RenderPass: PostFX['RenderPass'];
  UnrealBloomPass: PostFX['UnrealBloomPass'];
  OutputPass: PostFX['OutputPass'];
};

let cachedFX: Promise<ThreeFX> | null = null;

/** Load Three.js post-processing addons on the client. Null during SSG. */
export const loadThreeFX = (): Promise<ThreeFX> | null => {
  if (typeof window === 'undefined') return null;
  cachedFX ??= Promise.all([
    import('three/examples/jsm/postprocessing/EffectComposer.js'),
    import('three/examples/jsm/postprocessing/RenderPass.js'),
    import('three/examples/jsm/postprocessing/UnrealBloomPass.js'),
    import('three/examples/jsm/postprocessing/OutputPass.js'),
  ])
    .then(([ec, rp, ub, op]) => ({
      EffectComposer: ec.EffectComposer,
      RenderPass: rp.RenderPass,
      UnrealBloomPass: ub.UnrealBloomPass,
      OutputPass: op.OutputPass,
    }))
    .catch((err) => {
      cachedFX = null;
      throw err;
    });
  return cachedFX;
};
```

- [ ] **Step 4: Run test + typecheck**

Run: `pnpm exec vitest run src/lib/three.test.ts && pnpm typecheck`
Expected: PASS / clean. If `pnpm typecheck` errors that `three/examples/jsm/...` types are missing, switch the import specifiers (and the `typeof import(...)` types) to `three/addons/postprocessing/*` and re-run.

- [ ] **Step 5: Verify the addon paths resolve at build**

Run: `pnpm build 2>&1 | tail -5`
Expected: build succeeds. If it fails to resolve `three/examples/jsm/...`, switch all four specifiers to `three/addons/postprocessing/*.js` and rebuild. (Do NOT change anything else.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/three.ts src/lib/three.test.ts
git commit -m "feat(hero): add loadThreeFX loader for bloom post-processing addons"
```

---

## Task 2: `ParticleHero` — bloom (auto-scale) + hero-scoped scroll fly-through

**Files:** Modify (full rewrite) `src/components/ParticleHero/ParticleHero.tsx`; Test `src/components/ParticleHero/ParticleHero.test.tsx` (unchanged, must pass).

**Interfaces:**

- Consumes: `loadThree`, `loadThreeFX` from `src/lib/three.ts`.

- [ ] **Step 1: Confirm the existing test is green (baseline)**

Run: `pnpm exec vitest run src/components/ParticleHero/ParticleHero.test.tsx`
Expected: PASS (renders aria-hidden container, axe). It must still pass after the rewrite because the component still bails in jsdom (no 2D context) before any Three/FX code.

- [ ] **Step 2: Rewrite `src/components/ParticleHero/ParticleHero.tsx`**

Replace the whole file with:

```tsx
import { useEffect, useRef } from 'react';

import styles from './ParticleHero.module.scss';
import { loadThree, loadThreeFX } from '../../lib/three';

const COUNT = 5000;
const CYAN: [number, number, number] = [0.133, 0.827, 0.933];
const VIOLET: [number, number, number] = [0.655, 0.545, 0.98];

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

// Load → assemble "SK" → hold → disperse to ambient field.
const cohesionAt = (e: number) => {
  if (e < 0.3) return 0;
  if (e < 2.2) return smooth((e - 0.3) / 1.9);
  if (e < 3.7) return 1;
  if (e < 5.0) return 1 - smooth((e - 3.7) / 1.3);
  return 0;
};

export const ParticleHero = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = container.current;
    if (!el) return;

    // Sample "SK" from a 2D canvas. Bail if unavailable (jsdom / no-canvas).
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 256;
    sampleCanvas.height = 128;
    const sctx = sampleCanvas.getContext('2d');
    if (!sctx) return;
    sctx.fillStyle = '#fff';
    sctx.font = '900 96px monospace';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText('SK', 128, 68);
    const pixels = sctx.getImageData(0, 0, 256, 128).data;
    const opaque: [number, number][] = [];
    for (let y = 0; y < 128; y += 2) {
      for (let x = 0; x < 256; x += 2) {
        if (pixels[(y * 256 + x) * 4 + 3] > 128) opaque.push([x, y]);
      }
    }
    if (opaque.length === 0) return;

    let raf = 0;
    let disposed = false;
    const cleanups: Array<() => void> = [];

    const pending = loadThree();
    if (!pending) return;

    // Full bloom only on capable devices; else transparent additive fallback.
    const bloomCapable =
      window.matchMedia('(min-width: 900px)').matches &&
      window.matchMedia('(pointer: fine)').matches &&
      (window.devicePixelRatio || 1) <= 2.5;

    void pending.then(async (THREE) => {
      if (disposed) return;

      const width = el.clientWidth || 1;
      const height = el.clientHeight || 1;

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(width, height);
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
      camera.position.z = 26;

      const positions = new Float32Array(COUNT * 3);
      const targets = new Float32Array(COUNT * 3);
      const drift = new Float32Array(COUNT * 3);
      const colors = new Float32Array(COUNT * 3);
      for (let i = 0; i < COUNT; i++) {
        const ix = i * 3;
        const r = 18 + Math.random() * 14;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const dx = r * Math.sin(phi) * Math.cos(theta);
        const dy = r * Math.sin(phi) * Math.sin(theta) * 0.6;
        const dz = r * Math.cos(phi) * 0.6;
        drift[ix] = dx;
        drift[ix + 1] = dy;
        drift[ix + 2] = dz;
        positions[ix] = dx;
        positions[ix + 1] = dy;
        positions[ix + 2] = dz;
        const [px, py] = opaque[i % opaque.length];
        targets[ix] = (px - 128) / 6.2;
        targets[ix + 1] = -(py - 64) / 6.2;
        targets[ix + 2] = (Math.random() - 0.5) * 1.5;
        const c = Math.random() < 0.5 ? CYAN : VIOLET;
        colors[ix] = c[0];
        colors[ix + 1] = c[1];
        colors[ix + 2] = c[2];
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const sprite = document.createElement('canvas');
      sprite.width = 64;
      sprite.height = 64;
      const spctx = sprite.getContext('2d')!;
      const grd = spctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, 'rgba(255,255,255,1)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      spctx.fillStyle = grd;
      spctx.fillRect(0, 0, 64, 64);
      const texture = new THREE.CanvasTexture(sprite);

      const material = new THREE.PointsMaterial({
        size: 0.38,
        map: texture,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      // Core disposal registered before any await so an unmount mid-load cleans up.
      cleanups.push(() => {
        geometry.dispose();
        material.dispose();
        texture.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      });

      const pointer = { x: 0, y: 0, active: false };
      const onMove = (ev: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
        pointer.active = true;
      };
      window.addEventListener('pointermove', onMove);
      cleanups.push(() => window.removeEventListener('pointermove', onMove));

      let heroHeight = el.clientHeight || 1;
      const posAttr = geometry.getAttribute('position');
      const arr = posAttr.array as Float32Array;
      const start = performance.now();

      // Optional bloom composer (declared before frame/observers; assigned after await).
      let composer: { render: () => void; setSize: (w: number, h: number) => void } | null = null;
      let bloomSetSize: ((w: number, h: number) => void) | null = null;

      let visible = true;
      const frame = () => {
        raf = 0;
        const e = (performance.now() - start) / 1000;
        const coh = cohesionAt(e);
        const drf = 1 - coh;
        const mx = pointer.x * 18;
        const my = pointer.y * 12;
        for (let i = 0; i < COUNT; i++) {
          const ix = i * 3;
          const iy = ix + 1;
          const iz = ix + 2;
          const tx = targets[ix] * coh + (drift[ix] + Math.sin(e * 0.5 + i) * 1.4) * drf;
          const ty = targets[iy] * coh + (drift[iy] + Math.cos(e * 0.4 + i) * 1.4) * drf;
          const tz = targets[iz] * coh + drift[iz] * drf;
          arr[ix] += (tx - arr[ix]) * 0.06;
          arr[iy] += (ty - arr[iy]) * 0.06;
          arr[iz] += (tz - arr[iz]) * 0.06;
          if (pointer.active) {
            const ddx = arr[ix] - mx;
            const ddy = arr[iy] - my;
            const d2 = ddx * ddx + ddy * ddy;
            if (d2 < 36) {
              const d = Math.sqrt(d2) || 1;
              const f = (1 - d / 6) * 0.6;
              arr[ix] += (ddx / d) * f;
              arr[iy] += (ddy / d) * f;
            }
          }
        }
        posAttr.needsUpdate = true;
        // hero-scoped fly-through: fly the camera forward as you scroll out of the hero
        const p = Math.min(1, Math.max(0, window.scrollY / (heroHeight * 0.9)));
        camera.position.z += (26 - p * 34 - camera.position.z) * 0.08;
        points.rotation.y = Math.sin(e * 0.1) * 0.15 + drf * e * 0.02;
        if (composer) composer.render();
        else renderer.render(scene, camera);
        if (visible && !disposed) raf = requestAnimationFrame(frame);
      };
      const loop = () => {
        if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
      };

      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible) loop();
          else if (raf) {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        },
        { threshold: 0 },
      );
      io.observe(el);
      cleanups.push(() => io.disconnect());

      const onVis = () => {
        visible = !document.hidden;
        if (visible) loop();
      };
      document.addEventListener('visibilitychange', onVis);
      cleanups.push(() => document.removeEventListener('visibilitychange', onVis));

      const onResize = () => {
        const w = el.clientWidth || 1;
        const h = el.clientHeight || 1;
        heroHeight = h;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        composer?.setSize(w, h);
        bloomSetSize?.(w, h);
      };
      window.addEventListener('resize', onResize);
      cleanups.push(() => window.removeEventListener('resize', onResize));

      if (bloomCapable) {
        const fx = await loadThreeFX();
        if (disposed) return;
        if (fx) {
          renderer.setClearColor(0x020617, 1); // opaque: reliable bloom compositing
          const comp = new fx.EffectComposer(renderer);
          comp.addPass(new fx.RenderPass(scene, camera));
          const bloom = new fx.UnrealBloomPass(new THREE.Vector2(width, height), 0.9, 0.5, 0.0);
          comp.addPass(bloom);
          comp.addPass(new fx.OutputPass());
          composer = comp;
          bloomSetSize = (w, h) => bloom.setSize(w, h);
          cleanups.push(() => comp.dispose());
        }
      }

      loop();
    });

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return <div ref={container} className={styles.canvas} aria-hidden="true" />;
};
```

- [ ] **Step 3: Run the component test + typecheck**

Run: `pnpm exec vitest run src/components/ParticleHero/ParticleHero.test.tsx && pnpm typecheck`
Expected: PASS / clean. (In jsdom the effect bails at the 2D-context check, so none of the Three/FX code runs.)

- [ ] **Step 4: Build + confirm three still code-split**

Run: `pnpm build 2>&1 | tail -6 && ls -1 dist/assets/*.js | xargs -n1 basename`
Expected: build OK; a `three*` chunk still present (bloom addons ride the lazy Three chunk).

- [ ] **Step 5: Commit**

```bash
git add src/components/ParticleHero/ParticleHero.tsx
git commit -m "feat(hero): add auto-scaling bloom and hero-scoped scroll fly-through"
```

> **Controller note:** after this task, request the user's visual confirmation of the hero (`pnpm preview`) before proceeding — bloom/fly-through can't be verified headlessly.

---

## Task 3: Experience timeline motion

**Files:** Modify `src/sections/Experience/Experience.tsx` + `.module.scss`. Test: existing Experience suite stays green.

- [ ] **Step 1: Update `Experience.tsx`**

Set the import to include `ScrollTrigger`:

```tsx
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap';
```

Replace the `mm.add('(prefers-reduced-motion: no-preference)', ...)` body with:

```tsx
mm.add('(prefers-reduced-motion: no-preference)', () => {
  scrubReveal(`.${styles.item}`, root.current, { x: -20, y: 0 });
  gsap.from(`.${styles.line}`, {
    scaleY: 0,
    transformOrigin: 'top',
    ease: 'none',
    scrollTrigger: { trigger: root.current, start: 'top 75%', end: 'bottom 60%', scrub: true },
  });
  gsap.utils.toArray<HTMLElement>(`.${styles.item}`).forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 65%',
      end: 'bottom 55%',
      toggleClass: { targets: item, className: styles.active },
    });
  });
});
return () => mm.revert();
```

(Leave the rest of the component unchanged. `mm.revert()` reverts these ScrollTriggers and removes the toggled class.)

- [ ] **Step 2: Add active-state styling to `Experience.module.scss`**

Add `transition: all 0.3s ease;` to the existing `.dot` rule, and append:

```scss
.active .dot {
  background: $cyan;
  box-shadow: 0 0 18px rgba($cyan, 0.9);
  animation: dot-pulse 1.6s ease-in-out infinite;
}

.active .company {
  color: $cyan;
  text-shadow: 0 0 20px rgba($cyan, 0.35);
}

.company {
  transition: color 0.3s ease;
}

@keyframes dot-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.25);
  }
}

@media (prefers-reduced-motion: reduce) {
  .active .dot {
    animation: none;
  }
}
```

(`.active` here is the CSS-module local class matched by `styles.active` from the JS `toggleClass`.)

- [ ] **Step 3: Run Experience suite + stylelint + typecheck**

Run: `pnpm exec vitest run src/sections/Experience && pnpm stylelint:error && pnpm typecheck`
Expected: PASS / clean. Companies/roles still render; jsdom never toggles `active`, so the default static look is intact.

- [ ] **Step 4: Commit**

```bash
git add src/sections/Experience/
git commit -m "feat(experience): scrub-draw the timeline and pulse the active role"
```

---

## Task 4: About avatar duotone + hover glitch (CSS-only)

**Files:** Modify `src/sections/About/About.tsx` + `.module.scss`. Test: existing About suite stays green.

- [ ] **Step 1: Wrap the avatar in a `<figure>` in `About.tsx`**

Replace the existing `<img className={`${styles.avatar} ${styles.animate}`} ... />` with:

```tsx
<figure className={`${styles.avatar} ${styles.animate}`}>
  <img src={avatar} width={160} height={160} alt="Sushant Kumar" loading="lazy" />
</figure>
```

(Keep the `avatar` import and everything else unchanged.)

- [ ] **Step 2: Replace the `.avatar` rule in `About.module.scss`**

Replace the existing `.avatar { ... }` block with:

```scss
.avatar {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: 0 0 40px rgba($cyan, 0.12);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: grayscale(1) contrast(1.05);
  }

  // neon duotone tint over the greyscale photo
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(140deg, rgba($cyan, 0.55), rgba($violet, 0.55));
    mix-blend-mode: color;
    pointer-events: none;
  }

  &:hover img {
    animation: avatar-glitch 0.55s steps(2, end) 1;
  }
}

@keyframes avatar-glitch {
  0% {
    transform: translate(0, 0);
    filter: grayscale(1) contrast(1.05);
    clip-path: inset(0 0 0 0);
  }
  20% {
    transform: translate(-3px, 0);
    filter: grayscale(1) contrast(1.05) drop-shadow(3px 0 rgba($cyan, 0.7))
      drop-shadow(-3px 0 rgba($violet, 0.7));
    clip-path: inset(12% 0 58% 0);
  }
  40% {
    transform: translate(3px, 0);
    clip-path: inset(52% 0 20% 0);
  }
  60% {
    transform: translate(-2px, 0);
    filter: grayscale(1) contrast(1.05) drop-shadow(-3px 0 rgba($cyan, 0.7))
      drop-shadow(3px 0 rgba($violet, 0.7));
    clip-path: inset(34% 0 40% 0);
  }
  100% {
    transform: translate(0, 0);
    filter: grayscale(1) contrast(1.05);
    clip-path: inset(0 0 0 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .avatar:hover img {
    animation: none;
  }
}
```

- [ ] **Step 3: Run About suite + stylelint + typecheck**

Run: `pnpm exec vitest run src/sections/About && pnpm stylelint:error && pnpm typecheck`
Expected: PASS / clean. The avatar `alt="Sushant Kumar"` still resolves (existing test), duotone/glitch are CSS-only.

- [ ] **Step 4: Commit**

```bash
git add src/sections/About/
git commit -m "feat(about): neon duotone avatar with an RGB-split glitch on hover"
```

---

## Task 5: Global cursor `Spotlight`

**Files:** Create `src/components/Spotlight/{Spotlight.tsx,.module.scss,.test.tsx}`; Modify `src/App.tsx`.

**Interfaces:**

- Produces: `Spotlight` — fixed `aria-hidden` layer whose radial light eases toward the pointer; `pointer: fine` + motion only.

- [ ] **Step 1: Write the failing test**

Create `src/components/Spotlight/Spotlight.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { Spotlight } from './Spotlight';

describe('Spotlight', () => {
  it('renders an aria-hidden layer', () => {
    const { container } = render(<Spotlight />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });
  it('has no a11y violations', async () => {
    const { container } = render(<Spotlight />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run it, expect fail**

Run: `pnpm exec vitest run src/components/Spotlight/Spotlight.test.tsx`
Expected: FAIL — cannot resolve `./Spotlight`.

- [ ] **Step 3: SCSS module**

Create `src/components/Spotlight/Spotlight.module.scss`:

```scss
@use 'variables' as *;

.spotlight {
  position: fixed;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  mix-blend-mode: screen;
  background: radial-gradient(
    circle 260px at var(--x, 50%) var(--y, 50%),
    rgba($cyan, 0.06),
    transparent 60%
  );
}

@media (pointer: coarse) {
  .spotlight {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spotlight {
    display: none;
  }
}
```

- [ ] **Step 4: Component**

Create `src/components/Spotlight/Spotlight.tsx`:

```tsx
import { useEffect, useRef } from 'react';

import styles from './Spotlight.module.scss';

export const Spotlight = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
    };
    const tick = () => {
      cx += (tx - cx) * 0.15;
      cy += (ty - cy) * 0.15;
      el.style.setProperty('--x', `${cx}px`);
      el.style.setProperty('--y', `${cy}px`);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={ref} className={styles.spotlight} aria-hidden="true" />;
};
```

- [ ] **Step 5: Run test, expect pass**

Run: `pnpm exec vitest run src/components/Spotlight/Spotlight.test.tsx`
Expected: PASS (effect no-ops in jsdom; layer renders aria-hidden).

- [ ] **Step 6: Mount in `App.tsx`**

Add `import { Spotlight } from './components/Spotlight/Spotlight';` and render `<Spotlight />` immediately AFTER `<CursorGlow />` in the fragment.

- [ ] **Step 7: Run component suite + stylelint + typecheck + commit**

Run: `pnpm exec vitest run src/components && pnpm stylelint:error && pnpm typecheck`
Expected: PASS / clean.

```bash
git add src/components/Spotlight/ src/App.tsx
git commit -m "feat(cursor): add a soft cursor spotlight that lifts content under the pointer"
```

---

## Task 6: Verify + final review

- [ ] **Step 1: Full CI gate**

Run: `pnpm typecheck && pnpm lint:error && pnpm stylelint:error && pnpm secretlint && pnpm test`
Expected: all pass.

- [ ] **Step 2: Build + code-split check**

Run: `pnpm build` (expect success); `ls -1 dist/assets/*.js | xargs -n1 basename` — confirm a distinct `three*` chunk (now includes bloom addons) separate from the app entry.

- [ ] **Step 3: Manual browser check (defer to user if headless)**

`pnpm preview`, then verify: hero particles bloom on desktop; scrolling out of the hero flies the camera forward through the field; Experience line draws + dots pulse + active company highlights; About avatar is neon duotone and glitches on hover; a soft spotlight follows the cursor. Toggle OS reduce-motion → reload: no bloom/fly-through (static hero), timeline static, no glitch/spotlight.

- [ ] **Step 4: Commit any polish, then final review.**

```bash
git add -A && git commit -m "chore(anim): batch-3 polish and verification" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:** bloom → T1+T2; fly-through → T2; Experience timeline → T3; avatar duotone/glitch → T4; cursor spotlight → T5; verify → T6. All covered.

**Placeholder scan:** Task 1 Steps 4–5 give a concrete fallback (switch `three/examples/jsm/*` → `three/addons/*`) if types/build reject the path — a specific, bounded instruction, not a vague TODO. No other placeholders.

**Type consistency:** `loadThreeFX`/`ThreeFX` (T1) consumed in T2. `styles.active` toggled in T3 JS matches the `.active` CSS in T3 scss. `Spotlight` (T5) mounted in App (T5). `ParticleHero` public shape unchanged (no props) so `Hero` integration is untouched.
