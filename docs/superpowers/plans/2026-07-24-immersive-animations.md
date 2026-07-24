# Immersive Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cohesive neon motion layer — Three.js particle hero, custom cursor, scroll storytelling, and micro-interactions — to sushantk.dev without regressing SSG, accessibility, reduced-motion, or first-paint guarantees.

**Architecture:** Each effect is an isolated co-located unit (component folder or hook). Three.js is lazy-loaded via `src/lib/three.ts` (dynamic import, `window`-guarded) so it never blocks first paint and never runs during SSG. Every motion unit gates on `pointer: fine` and/or `prefers-reduced-motion`, degrading to today's calm static site. GSAP is always imported from `src/lib/gsap.ts`.

**Tech Stack:** Vite · React 19 · TypeScript · SCSS modules · GSAP + ScrollTrigger · Three.js (new, code-split) · Vitest + Testing Library + jest-axe.

## Global Constraints

- Package manager is **pnpm** — never npm/yarn.
- Content stays data-driven: **no changes to `src/data/*`** and no copy changes.
- All GSAP imports come from `src/lib/gsap.ts`; Three.js imports come from `src/lib/three.ts`.
- Every decorative canvas/cursor/rail layer is `aria-hidden="true"` and `pointer-events: none` where it overlays content.
- Every new component/hook ships a test that includes `expect(await axe(container)).toHaveNoViolations()`.
- Every motion effect must be skipped under `prefers-reduced-motion: reduce`; the reduced-motion result equals today's site.
- CI gate must stay green, in order: `pnpm typecheck`, `pnpm lint:error`, `pnpm stylelint:error`, `pnpm secretlint`, `pnpm test`.
- Palette (from `src/styles/_variables.scss`): bg `#020617`, cyan `#22d3ee`, violet `#a78bfa`, ink `#e6f0ff`, border `#1e2740`.
- Commits use Conventional Commits.
- Branch is `feat/immersive-animations` (already created).

---

## Task 1: Three.js dependency + lazy loader (`src/lib/three.ts`)

**Files:**

- Modify: `package.json` (add `three` + `@types/three`)
- Create: `src/lib/three.ts`
- Test: `src/lib/three.test.ts`

**Interfaces:**

- Produces: `loadThree(): Promise<typeof import('three')> | null` — resolves the Three.js module client-side; returns `null` during SSG (no `window`). Cached after first call.

- [ ] **Step 1: Install Three.js**

Run:

```bash
pnpm add three && pnpm add -D @types/three
```

Expected: both added to `package.json`, lockfile updated.

- [ ] **Step 2: Write the failing test**

Create `src/lib/three.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

import { loadThree } from './three';

describe('loadThree', () => {
  it('resolves the three module in a browser-like env', async () => {
    const three = await loadThree();
    expect(three).not.toBeNull();
    expect(three!.Scene).toBeDefined();
    expect(three!.WebGLRenderer).toBeDefined();
  });

  it('returns the same cached promise on repeat calls', () => {
    expect(loadThree()).toBe(loadThree());
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run src/lib/three.test.ts`
Expected: FAIL — `Cannot find module './three'`.

- [ ] **Step 4: Implement the loader**

Create `src/lib/three.ts`:

```ts
// SSG-safe lazy loader for Three.js. The dynamic import keeps Three out of the
// initial bundle (code-split chunk) and out of the Node prerender path.
export type ThreeModule = typeof import('three');

let cached: Promise<ThreeModule> | null = null;

/** Load Three.js on the client. Returns null during SSG/prerender (no window). */
export const loadThree = (): Promise<ThreeModule> | null => {
  if (typeof window === 'undefined') return null;
  cached ??= import('three');
  return cached;
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/lib/three.test.ts`
Expected: PASS (both tests).

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/three.ts src/lib/three.test.ts
git commit -m "feat(hero): add three.js dependency and ssg-safe lazy loader"
```

---

## Task 2: `ParticleHero` component

**Files:**

- Create: `src/components/ParticleHero/ParticleHero.tsx`
- Create: `src/components/ParticleHero/ParticleHero.module.scss`
- Test: `src/components/ParticleHero/ParticleHero.test.tsx`

**Interfaces:**

- Consumes: `loadThree` from `src/lib/three.ts`.
- Produces: `ParticleHero` — a React component rendering a single `aria-hidden` container `<div>`; mounts a Three.js `Points` system on the client and bails gracefully when reduced-motion is set or a 2D canvas context is unavailable (jsdom / no-canvas browsers).

> **Testability note:** the component samples "SK" from an offscreen 2D canvas _before_ touching Three.js. jsdom returns `null` from `canvas.getContext('2d')`, so the effect bails there — no WebGL, no Three.js execution in tests. This replaces the spec's "mock Three in setup" idea with a graceful early-return that also protects real browsers lacking canvas.

- [ ] **Step 1: Write the failing test**

Create `src/components/ParticleHero/ParticleHero.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { ParticleHero } from './ParticleHero';

describe('ParticleHero', () => {
  it('renders an aria-hidden container without throwing', () => {
    const { container } = render(<ParticleHero />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<ParticleHero />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/ParticleHero/ParticleHero.test.tsx`
Expected: FAIL — cannot resolve `./ParticleHero`.

- [ ] **Step 3: Write the SCSS module**

Create `src/components/ParticleHero/ParticleHero.module.scss`:

```scss
.canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;

  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
}
```

- [ ] **Step 4: Write the component**

Create `src/components/ParticleHero/ParticleHero.tsx`:

```tsx
import { useEffect, useRef } from 'react';

import styles from './ParticleHero.module.scss';
import { loadThree } from '../../lib/three';

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

    // Sample "SK" target positions from a 2D canvas. Bail if unavailable (jsdom).
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

    void pending.then((THREE) => {
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

      // Round glow sprite.
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
        size: 0.5,
        map: texture,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const pointer = { x: 0, y: 0, active: false };
      const onMove = (ev: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
        pointer.active = true;
      };
      window.addEventListener('pointermove', onMove);
      cleanups.push(() => window.removeEventListener('pointermove', onMove));

      const posAttr = geometry.getAttribute('position');
      const arr = posAttr.array as Float32Array;
      const start = performance.now();

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
        points.rotation.y = Math.sin(e * 0.1) * 0.15 + drf * e * 0.02;
        renderer.render(scene, camera);
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
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', onResize);
      cleanups.push(() => window.removeEventListener('resize', onResize));

      cleanups.push(() => {
        geometry.dispose();
        material.dispose();
        texture.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
      });

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

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/ParticleHero/ParticleHero.test.tsx`
Expected: PASS (2 tests). jsdom "getContext not implemented" warnings are benign.

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/ParticleHero/
git commit -m "feat(hero): add three.js particle field that assembles into SK then disperses"
```

---

## Task 3: Mount `ParticleHero` in `Hero` + delay text reveal

**Files:**

- Modify: `src/sections/Hero/Hero.tsx`
- Test: `src/sections/Hero/Hero.test.tsx` (unchanged assertions must still pass)

**Interfaces:**

- Consumes: `ParticleHero` from Task 2.

- [ ] **Step 1: Confirm existing Hero test still describes required behavior**

Run: `pnpm exec vitest run src/sections/Hero/Hero.test.tsx`
Expected: PASS (baseline before edit).

- [ ] **Step 2: Edit `Hero.tsx` to mount ParticleHero and delay the reveal**

In `src/sections/Hero/Hero.tsx`:

Add the import after the `GlowBackground` import:

```tsx
import { ParticleHero } from '../../components/ParticleHero/ParticleHero';
```

Change the reveal tween so hero text fades in over the settled particle field. Replace the existing `gsap.from(`.${styles.reveal}`, {...})` call with:

```tsx
gsap.from(`.${styles.reveal}`, {
  opacity: 0,
  y: 24,
  duration: 0.7,
  ease: 'expo.out',
  stagger: 0.08,
  delay: 3.4,
});
```

Mount `ParticleHero` right after `<GlowBackground />` inside the `<section>`:

```tsx
      <GlowBackground />
      <ParticleHero />
```

- [ ] **Step 3: Ensure hero text sits above the canvas**

In `src/sections/Hero/Hero.module.scss`, confirm `.inner` has a stacking context above the canvas (`z-index: 1` on canvas from Task 2). Add to the `.inner` rule if not already present:

```scss
position: relative;
z-index: 2;
```

- [ ] **Step 4: Run Hero tests**

Run: `pnpm exec vitest run src/sections/Hero/Hero.test.tsx`
Expected: PASS — the h1, role, and chips still render (reveal delay/canvas do not affect jsdom output; ParticleHero bails without a 2D context).

- [ ] **Step 5: Commit**

```bash
git add src/sections/Hero/Hero.tsx src/sections/Hero/Hero.module.scss
git commit -m "feat(hero): mount particle field and fade hero text in over the settled scene"
```

---

## Task 4: `useMagnetic` hook + magnetic `Chip`

**Files:**

- Create: `src/hooks/useMagnetic.ts`
- Test: `src/hooks/useMagnetic.test.tsx`
- Modify: `src/test/setup.ts` (add `quickTo` to the gsap mock)
- Modify: `src/components/Chip/Chip.tsx`

**Interfaces:**

- Produces: `useMagnetic(ref: RefObject<HTMLElement | null>, enabled?: boolean, strength?: number): void` — pulls the element toward the pointer on hover; no-op unless `pointer: fine` and motion allowed.
- Produces: `Chip` gains optional `magnetic?: boolean` prop.

- [ ] **Step 1: Add `quickTo` to the gsap test mock**

In `src/test/setup.ts`, inside the `gsap` object in the `vi.mock('gsap', ...)` factory, add:

```ts
    quickTo: () => () => {},
```

(place it alongside `set`, `to`, etc.)

- [ ] **Step 2: Write the failing test**

Create `src/hooks/useMagnetic.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useMagnetic } from './useMagnetic';

const Host = () => {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref, true);
  return <button ref={ref}>press</button>;
};

describe('useMagnetic', () => {
  it('renders its host element without throwing (no-op when pointer is not fine)', () => {
    const { getByRole } = render(<Host />);
    expect(getByRole('button', { name: 'press' })).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Host />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run src/hooks/useMagnetic.test.tsx`
Expected: FAIL — cannot resolve `./useMagnetic`.

- [ ] **Step 4: Implement the hook**

Create `src/hooks/useMagnetic.ts`:

```ts
import { useEffect, type RefObject } from 'react';

import { gsap } from '../lib/gsap';

/** Pull an element toward the pointer on hover. No-op on touch or reduced motion. */
export const useMagnetic = (ref: RefObject<HTMLElement | null>, enabled = true, strength = 0.4) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3.out' });

    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((ev.clientX - (r.left + r.width / 2)) * strength);
      yTo((ev.clientY - (r.top + r.height / 2)) * strength);
    };
    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [ref, enabled, strength]);
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/hooks/useMagnetic.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Add `magnetic` support to `Chip`**

Replace `src/components/Chip/Chip.tsx` with:

```tsx
import { useRef } from 'react';

import styles from './Chip.module.scss';
import { useMagnetic } from '../../hooks/useMagnetic';

type Props = {
  children: React.ReactNode;
  variant?: 'cyan' | 'violet' | 'green';
  magnetic?: boolean;
};

export const Chip = ({ children, variant = 'cyan', magnetic = false }: Props) => {
  const ref = useRef<HTMLSpanElement>(null);
  useMagnetic(ref, magnetic);
  return (
    <span
      ref={ref}
      data-magnetic={magnetic || undefined}
      className={`${styles.chip} ${styles[variant]}`}
    >
      {children}
    </span>
  );
};
```

- [ ] **Step 7: Enable magnetic chips in Hero and Skills**

In `src/sections/Hero/Hero.tsx`, change the chip render to:

```tsx
<Chip key={c} magnetic>
  {c}
</Chip>
```

In `src/sections/Skills/Skills.tsx`, add the `magnetic` prop to the `<Chip>` used for skills (locate the `<Chip ...>` in the map and add `magnetic`). Keep all other props unchanged.

- [ ] **Step 8: Run the affected tests**

Run: `pnpm exec vitest run src/components src/sections/Hero src/sections/Skills`
Expected: PASS — chips still render their text; `data-magnetic` does not affect queries.

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useMagnetic.ts src/hooks/useMagnetic.test.tsx src/test/setup.ts src/components/Chip/Chip.tsx src/sections/Hero/Hero.tsx src/sections/Skills/Skills.tsx
git commit -m "feat(cursor): add useMagnetic hook and magnetic chips"
```

---

## Task 5: `CursorGlow` component + mount in `App`

**Files:**

- Create: `src/components/CursorGlow/CursorGlow.tsx`
- Create: `src/components/CursorGlow/CursorGlow.module.scss`
- Test: `src/components/CursorGlow/CursorGlow.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**

- Produces: `CursorGlow` — global component rendering a trailing dot + ring (both `aria-hidden`), active only on `pointer: fine` with motion allowed. Reads no props.

- [ ] **Step 1: Write the failing test**

Create `src/components/CursorGlow/CursorGlow.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { CursorGlow } from './CursorGlow';

describe('CursorGlow', () => {
  it('renders two aria-hidden layers', () => {
    const { container } = render(<CursorGlow />);
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden.length).toBe(2);
  });

  it('has no a11y violations', async () => {
    const { container } = render(<CursorGlow />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/CursorGlow/CursorGlow.test.tsx`
Expected: FAIL — cannot resolve `./CursorGlow`.

- [ ] **Step 3: Write the SCSS module**

Create `src/components/CursorGlow/CursorGlow.module.scss`:

```scss
@use 'variables' as *;

.dot,
.ring {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  pointer-events: none;
  border-radius: 50%;
  will-change: transform;
}

.dot {
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  background: $cyan;
  box-shadow: 0 0 12px 2px rgb(34 211 238 / 60%);
}

.ring {
  width: 34px;
  height: 34px;
  margin: -17px 0 0 -17px;
  border: 1px solid rgb(167 139 250 / 60%);
  transition:
    width 0.25s $ease-out,
    height 0.25s $ease-out,
    margin 0.25s $ease-out,
    border-color 0.25s $ease-out;
}

.active {
  width: 56px;
  height: 56px;
  margin: -28px 0 0 -28px;
  border-color: $cyan;
}

@media (pointer: coarse) {
  .dot,
  .ring {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot,
  .ring {
    display: none;
  }
}
```

- [ ] **Step 4: Write the component**

Create `src/components/CursorGlow/CursorGlow.tsx`:

```tsx
import { useEffect, useRef } from 'react';

import styles from './CursorGlow.module.scss';
import { gsap } from '../../lib/gsap';

export const CursorGlow = () => {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const d = dot.current;
    const r = ring.current;
    if (!d || !r) return;

    const dx = gsap.quickTo(d, 'x', { duration: 0.15, ease: 'power2.out' });
    const dy = gsap.quickTo(d, 'y', { duration: 0.15, ease: 'power2.out' });
    const rx = gsap.quickTo(r, 'x', { duration: 0.4, ease: 'power3.out' });
    const ry = gsap.quickTo(r, 'y', { duration: 0.4, ease: 'power3.out' });

    const onMove = (ev: PointerEvent) => {
      dx(ev.clientX);
      dy(ev.clientY);
      rx(ev.clientX);
      ry(ev.clientY);
    };
    const interactive = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest('a, button, [data-magnetic]');
    const onOver = (ev: PointerEvent) => {
      if (interactive(ev.target)) r.classList.add(styles.active);
    };
    const onOut = (ev: PointerEvent) => {
      if (interactive(ev.target)) r.classList.remove(styles.active);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerover', onOver);
    window.addEventListener('pointerout', onOut);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerout', onOut);
    };
  }, []);

  return (
    <>
      <div ref={ring} className={styles.ring} aria-hidden="true" />
      <div ref={dot} className={styles.dot} aria-hidden="true" />
    </>
  );
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/CursorGlow/CursorGlow.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Mount in `App`**

In `src/App.tsx`, add the import:

```tsx
import { CursorGlow } from './components/CursorGlow/CursorGlow';
```

Render `<CursorGlow />` as the first child inside the fragment (before `<SkipLink />`):

```tsx
  <>
    <CursorGlow />
    <SkipLink />
```

- [ ] **Step 7: Run the component suite**

Run: `pnpm exec vitest run src/components`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/CursorGlow/ src/App.tsx
git commit -m "feat(cursor): add trailing cursor glow with interactive-hover ring"
```

---

## Task 6: `useScramble` hook + scrambled section headings

**Files:**

- Create: `src/hooks/useScramble.ts`
- Test: `src/hooks/useScramble.test.tsx`
- Modify: `src/components/SectionHeading/SectionHeading.tsx`
- Test: `src/components/SectionHeading/SectionHeading.test.tsx` (create if absent; otherwise update)

**Interfaces:**

- Consumes: `ScrollTrigger` from `src/lib/gsap.ts`.
- Produces: `useScramble(ref: RefObject<HTMLElement | null>, text: string): void` — decodes `text` from random glyphs when the element scrolls into view; sets final text immediately under reduced motion.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useScramble.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useScramble } from './useScramble';

const Host = ({ text }: { text: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useScramble(ref, text);
  return <span ref={ref}>{text}</span>;
};

describe('useScramble', () => {
  it('shows the final text (reduced motion / no trigger in jsdom)', () => {
    const { getByText } = render(<Host text="Experience" />);
    expect(getByText('Experience')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Host text="Projects" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/hooks/useScramble.test.tsx`
Expected: FAIL — cannot resolve `./useScramble`.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useScramble.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/hooks/useScramble.test.tsx`
Expected: PASS (2 tests). (In jsdom `ScrollTrigger.create` is mocked and never fires `onEnter`, so the element keeps its final text.)

- [ ] **Step 5: Wire scramble into `SectionHeading`**

Replace `src/components/SectionHeading/SectionHeading.tsx` with:

```tsx
import { useRef } from 'react';

import styles from './SectionHeading.module.scss';
import { useScramble } from '../../hooks/useScramble';

type Props = { id: string; title: string; eyebrow?: string };

export const SectionHeading = ({ id, title, eyebrow }: Props) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  useScramble(titleRef, title);
  useScramble(eyebrowRef, eyebrow ?? '');
  return (
    <header className={styles.head}>
      {eyebrow && (
        <p ref={eyebrowRef} className={styles.eyebrow}>
          {eyebrow}
        </p>
      )}
      <h2 id={id} ref={titleRef} className={styles.title}>
        {title}
      </h2>
    </header>
  );
};
```

- [ ] **Step 6: Add / update SectionHeading test**

Create `src/components/SectionHeading/SectionHeading.test.tsx` (or update to match):

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { SectionHeading } from './SectionHeading';

describe('SectionHeading', () => {
  it('renders the title and eyebrow text', () => {
    render(<SectionHeading id="x" title="Experience" eyebrow="// career --log" />);
    expect(screen.getByRole('heading', { level: 2, name: 'Experience' })).toBeInTheDocument();
    expect(screen.getByText('// career --log')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<SectionHeading id="x" title="Projects" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 7: Run affected suites**

Run: `pnpm exec vitest run src/components/SectionHeading src/hooks src/sections`
Expected: PASS — section tests that query heading text still find final text (scramble only runs on ScrollTrigger enter, which does not fire in jsdom).

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useScramble.ts src/hooks/useScramble.test.tsx src/components/SectionHeading/
git commit -m "feat(scroll): decode section headings with a scramble-in effect"
```

---

## Task 7: `useTilt` hook + 3D tilt on project cards

**Files:**

- Create: `src/hooks/useTilt.ts`
- Test: `src/hooks/useTilt.test.tsx`
- Modify: `src/sections/Projects/Projects.tsx`
- Modify: `src/sections/Projects/Projects.module.scss`

**Interfaces:**

- Produces: `useTilt(ref: RefObject<HTMLElement | null>, max?: number): void` — rotates the element toward the pointer; no-op on touch / reduced motion.

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useTilt.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useTilt } from './useTilt';

const Host = () => {
  const ref = useRef<HTMLDivElement>(null);
  useTilt(ref);
  return <div ref={ref}>card</div>;
};

describe('useTilt', () => {
  it('renders its host without throwing', () => {
    const { getByText } = render(<Host />);
    expect(getByText('card')).toBeInTheDocument();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Host />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/hooks/useTilt.test.tsx`
Expected: FAIL — cannot resolve `./useTilt`.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useTilt.ts`:

```ts
import { useEffect, type RefObject } from 'react';

import { gsap } from '../lib/gsap';

/** Tilt an element toward the pointer in 3D. No-op on touch or reduced motion. */
export const useTilt = (ref: RefObject<HTMLElement | null>, max = 8) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power2.out' });
    const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power2.out' });

    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (ev.clientX - r.left) / r.width - 0.5;
      const py = (ev.clientY - r.top) / r.height - 0.5;
      rotY(px * max * 2);
      rotX(-py * max * 2);
    };
    const onLeave = () => {
      rotX(0);
      rotY(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      gsap.set(el, { rotationX: 0, rotationY: 0 });
    };
  }, [ref, max]);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/hooks/useTilt.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Apply tilt to project cards**

Replace `src/sections/Projects/Projects.tsx` with:

```tsx
import { useRef } from 'react';

import styles from './Projects.module.scss';
import { Chip } from '../../components/Chip/Chip';
import { SectionHeading } from '../../components/SectionHeading/SectionHeading';
import { projects } from '../../data/projects';
import { useTilt } from '../../hooks/useTilt';
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap';

type Project = (typeof projects)[number];

const ProjectCard = ({ project }: { project: Project }) => {
  const ref = useRef<HTMLLIElement>(null);
  useTilt(ref);
  return (
    <li ref={ref} className={styles.card}>
      <h3 className={styles.title}>{project.title}</h3>
      <p className={styles.blurb}>{project.blurb}</p>
      <div className={styles.tech}>
        {project.tech.map((t) => (
          <Chip key={t} variant="violet">
            {t}
          </Chip>
        ))}
      </div>
    </li>
  );
};

export const Projects = () => {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.card}`, {
          opacity: 0,
          y: 24,
          scale: 0.96,
          duration: 0.5,
          ease: 'back.out(1.4)',
          stagger: 0.08,
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
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
    <section id="projects" ref={root} className={styles.projects}>
      <div className={styles.inner}>
        <SectionHeading id="projects-h" title="Projects" eyebrow="// selected work" />
        <ul className={styles.grid}>
          {projects.map((p) => (
            <ProjectCard key={p.title} project={p} />
          ))}
        </ul>
      </div>
    </section>
  );
};
```

- [ ] **Step 6: Add perspective + neon hover glow to the cards**

In `src/sections/Projects/Projects.module.scss`:

Add `perspective: 1000px;` to the `.grid` rule. Add to the `.card` rule:

```scss
transform-style: preserve-3d;
transition:
  box-shadow 0.3s ease,
  border-color 0.3s ease;

&:hover,
&:focus-within {
  border-color: rgb(34 211 238 / 50%);
  box-shadow:
    0 0 0 1px rgb(34 211 238 / 20%),
    0 20px 50px -24px rgb(34 211 238 / 45%);
}
```

(Merge these declarations into the existing `.card` selector; do not duplicate the selector.)

- [ ] **Step 7: Run Projects tests**

Run: `pnpm exec vitest run src/sections/Projects`
Expected: PASS — all project titles/blurbs/tech render; the `ProjectCard` wrapper does not change queryable output.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useTilt.ts src/hooks/useTilt.test.tsx src/sections/Projects/
git commit -m "feat(projects): add 3d cursor tilt and neon hover glow to cards"
```

---

## Task 8: `ScrollProgress` rail + active-section Nav + mount in `App`

**Files:**

- Create: `src/components/ScrollProgress/ScrollProgress.tsx`
- Create: `src/components/ScrollProgress/ScrollProgress.module.scss`
- Test: `src/components/ScrollProgress/ScrollProgress.test.tsx`
- Modify: `src/components/Nav/Nav.tsx`
- Modify: `src/components/Nav/Nav.module.scss`
- Modify: `src/App.tsx`

**Interfaces:**

- Consumes: `gsap`, `ScrollTrigger` from `src/lib/gsap.ts`.
- Produces: `ScrollProgress` — a fixed `aria-hidden` neon rail whose fill scales with page scroll progress.
- Produces: `Nav` gains an active-link highlight tracking the section in view.

- [ ] **Step 1: Write the failing ScrollProgress test**

Create `src/components/ScrollProgress/ScrollProgress.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { ScrollProgress } from './ScrollProgress';

describe('ScrollProgress', () => {
  it('renders an aria-hidden rail', () => {
    const { container } = render(<ScrollProgress />);
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });

  it('has no a11y violations', async () => {
    const { container } = render(<ScrollProgress />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/ScrollProgress/ScrollProgress.test.tsx`
Expected: FAIL — cannot resolve `./ScrollProgress`.

- [ ] **Step 3: Write the SCSS module**

Create `src/components/ScrollProgress/ScrollProgress.module.scss`:

```scss
@use 'variables' as *;

.rail {
  position: fixed;
  top: 0;
  left: 0;
  width: 3px;
  height: 100vh;
  z-index: 40;
  background: rgb(30 39 64 / 60%);
  pointer-events: none;
}

.fill {
  position: absolute;
  inset: 0;
  transform: scaleY(0);
  transform-origin: top;
  background: linear-gradient(180deg, $cyan, $violet);
  box-shadow: 0 0 12px rgb(34 211 238 / 60%);
}

@include mq(md) {
  .rail {
    width: 100%;
    height: 3px;
  }

  .fill {
    transform: scaleX(0);
    transform-origin: left;
  }
}
```

> If `_mixins.scss` does not export an `mq` mixin, replace the `@include mq(md) { ... }` block with a `@media (max-width: 768px) { ... }` block containing the same rules. Verify by reading `src/styles/_mixins.scss` first.

- [ ] **Step 4: Write the component**

Create `src/components/ScrollProgress/ScrollProgress.tsx`:

```tsx
import { useEffect, useRef } from 'react';

import styles from './ScrollProgress.module.scss';
import { gsap, ScrollTrigger } from '../../lib/gsap';

export const ScrollProgress = () => {
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = fill.current;
    if (!el) return;
    const vertical = window.matchMedia('(min-width: 769px)').matches;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self: { progress: number }) => {
        gsap.set(el, vertical ? { scaleY: self.progress } : { scaleX: self.progress });
      },
    });
    return () => st.kill?.();
  }, []);

  return (
    <div className={styles.rail} aria-hidden="true">
      <div ref={fill} className={styles.fill} />
    </div>
  );
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/ScrollProgress/ScrollProgress.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Add active-section highlight to `Nav`**

Replace `src/components/Nav/Nav.tsx` with:

```tsx
import { useEffect, useState } from 'react';

import styles from './Nav.module.scss';
import { ScrollTrigger } from '../../lib/gsap';

const LINKS = [
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'projects', label: 'projects' },
  { id: 'skills', label: 'skills' },
  { id: 'contact', label: 'contact' },
];

export const Nav = () => {
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const triggers = LINKS.map((l) => {
      const section = document.getElementById(l.id);
      if (!section) return null;
      return ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self: { isActive: boolean }) => {
          if (self.isActive) setActive(l.id);
        },
      });
    });
    return () => triggers.forEach((t) => t?.kill?.());
  }, []);

  return (
    <nav className={styles.nav} aria-label="Primary">
      <a className={styles.brand} href="#top">
        SK<span>.</span>
      </a>
      <ul className={styles.links}>
        {LINKS.map((l) => (
          <li key={l.id}>
            <a
              href={`#${l.id}`}
              className={active === l.id ? styles.active : undefined}
              aria-current={active === l.id ? 'true' : undefined}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
```

- [ ] **Step 7: Add the active-link style**

In `src/components/Nav/Nav.module.scss`, add (adapt color token usage to the file's existing `@use`):

```scss
.active {
  color: $cyan;
}
```

- [ ] **Step 8: Mount `ScrollProgress` in `App`**

In `src/App.tsx`, add the import:

```tsx
import { ScrollProgress } from './components/ScrollProgress/ScrollProgress';
```

Render `<ScrollProgress />` right after `<CursorGlow />` in the fragment.

- [ ] **Step 9: Run affected suites**

Run: `pnpm exec vitest run src/components`
Expected: PASS — Nav still renders all five links; a11y checks pass (ScrollTrigger mocked → `active` stays empty in jsdom).

- [ ] **Step 10: Commit**

```bash
git add src/components/ScrollProgress/ src/components/Nav/ src/App.tsx
git commit -m "feat(scroll): add scroll-progress rail and active-section nav highlight"
```

---

## Task 9: Scroll-linked reveals + hero parallax (`src/lib/motion.ts`)

**Files:**

- Create: `src/lib/motion.ts`
- Test: `src/lib/motion.test.ts`
- Modify: `src/sections/Experience/Experience.tsx`
- Modify: `src/sections/About/About.tsx`
- Modify: `src/sections/Skills/Skills.tsx`
- Modify: `src/sections/Hero/Hero.tsx`

**Interfaces:**

- Consumes: `gsap` from `src/lib/gsap.ts`.
- Produces: `scrubReveal(targets: gsap.TweenTarget, trigger: Element | null, vars?: gsap.TweenVars): gsap.core.Tween` — a scrub-linked fade/slide-in reveal tied to scroll position.

- [ ] **Step 1: Write the failing test**

Create `src/lib/motion.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

import { scrubReveal } from './motion';
import { gsap } from './gsap';

describe('scrubReveal', () => {
  it('calls gsap.from with a scrubbed ScrollTrigger config', () => {
    const spy = vi.spyOn(gsap, 'from');
    const el = document.createElement('div');
    scrubReveal('.item', el);
    expect(spy).toHaveBeenCalledTimes(1);
    const vars = spy.mock.calls[0][1] as Record<string, unknown>;
    const st = vars.scrollTrigger as Record<string, unknown>;
    expect(st.scrub).toBe(true);
    expect(st.trigger).toBe(el);
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/lib/motion.test.ts`
Expected: FAIL — cannot resolve `./motion`.

- [ ] **Step 3: Implement the helper**

Create `src/lib/motion.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/lib/motion.test.ts`
Expected: PASS.

- [ ] **Step 5: Use `scrubReveal` in Experience**

In `src/sections/Experience/Experience.tsx`, add import:

```tsx
import { scrubReveal } from '../../lib/motion';
```

Inside the `mm.add('(prefers-reduced-motion: no-preference)', ...)` callback, replace the `.item` `gsap.from(...)` call with:

```tsx
scrubReveal(`.${styles.item}`, root.current, { x: -20, y: 0 });
```

Leave the `.line` scaleY draw tween unchanged.

- [ ] **Step 6: Use `scrubReveal` in About and Skills**

In `src/sections/About/About.tsx` and `src/sections/Skills/Skills.tsx`, add `import { scrubReveal } from '../../lib/motion';` and replace each section's primary reveal `gsap.from(...)` (the one triggered on scroll) with a `scrubReveal(<the same target selector>, root.current, <any extra vars that were set, e.g. { x, scale }>)` call. Preserve each file's existing `matchMedia`/cleanup structure and any non-reveal tweens.

> Read each file first; keep the exact target selector it already uses. Do not change copy or markup.

- [ ] **Step 7: Add hero parallax**

In `src/sections/Hero/Hero.tsx`, inside the existing `mm.add('(prefers-reduced-motion: no-preference)', ...)` callback (after the reveal tween), add a subtle parallax on the hero inner content:

```tsx
gsap.to(`.${styles.inner}`, {
  yPercent: 12,
  ease: 'none',
  scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true },
});
```

- [ ] **Step 8: Run the full section + lib suites**

Run: `pnpm exec vitest run src/sections src/lib`
Expected: PASS — content renders; gsap is mocked so scrub configs are inert in jsdom.

- [ ] **Step 9: Commit**

```bash
git add src/lib/motion.ts src/lib/motion.test.ts src/sections/Experience/ src/sections/About/ src/sections/Skills/ src/sections/Hero/Hero.tsx
git commit -m "feat(scroll): scrub-link section reveals and add hero parallax"
```

---

## Task 10: Full verification + polish + open PR

**Files:** none created; verification + PR only.

- [ ] **Step 1: Run the full CI gate locally, in order**

Run:

```bash
pnpm typecheck && pnpm lint:error && pnpm stylelint:error && pnpm secretlint && pnpm test
```

Expected: all pass. Fix any failures before continuing.

- [ ] **Step 2: Verify the production build and Three.js code-splitting**

Run:

```bash
pnpm build
```

Expected: build succeeds. Confirm a separate `three`-containing chunk exists in `dist/assets` (it must NOT be merged into the main entry chunk):

```bash
ls -1 dist/assets | grep -iE 'three|index'
```

Expected: a distinct chunk whose size reflects Three.js, separate from the app entry. If Three is bundled into the entry chunk, the dynamic `import('three')` was defeated — investigate before proceeding.

- [ ] **Step 3: Manual smoke test in preview**

Run:

```bash
pnpm preview
```

Then verify in a browser:

- Hero: particles fly in → form "SK" → disperse; hero text fades in after; cursor pushes particles.
- Custom cursor: dot + ring follow the pointer; ring expands over links/buttons/chips; chips pull toward the cursor.
- Scroll: progress rail fills; nav highlights the active section; section reveals track scroll; headings scramble-decode on entry; project cards tilt on hover.
- Toggle OS "reduce motion" → reload: no cursor, no particles, static hero text, plain reveals (matches today's site).

- [ ] **Step 4: Commit any polish fixes**

```bash
git add -A
git commit -m "chore(animations): polish pass and perf verification"
```

(Skip if there were no changes.)

- [ ] **Step 5: Push and open the PR**

Run:

```bash
git push -u origin feat/immersive-animations
```

Then open a PR (`gh pr create`) with a summary of the four pillars, the reduced-motion/accessibility guarantees, and the Three.js code-split note. The Firebase `testbed` preview will deploy and comment its URL on the PR.

---

## Self-Review

**Spec coverage:**

- Particle hero (reveal → ambient) → Tasks 1–3. ✅
- Custom cursor + magnetic → Tasks 4–5. ✅
- Scroll storytelling (progress rail, parallax, scrub reveals, eyebrow scramble, nav sync) → Tasks 6, 8, 9. ✅
- Micro-interactions (scramble, magnetic chips, project tilt, skills stagger) → Tasks 4, 6, 7, 9. ✅
- SSG safety / lazy Three → Tasks 1, 2, 10 (chunk check). ✅
- Reduced-motion parity → guarded in every task; verified in Task 10 Step 3. ✅
- a11y tests on every new unit → present in Tasks 2, 4, 5, 6, 7, 8. ✅
- CI gate unchanged → Task 10 Step 1. ✅
- No `src/data/*` changes → honored throughout. ✅

**Placeholder scan:** Two intentional "read the file first" notes (Task 8 SCSS mixin fallback, Task 9 Steps 6) remain because About/Skills reveal selectors and the `mq` mixin's existence must be confirmed against the actual files; both give the exact transformation and a concrete fallback, not vague "handle it" instructions.

**Type consistency:** `loadThree` (Task 1) consumed in Task 2. `useMagnetic(ref, enabled, strength)` (Task 4) consumed by `Chip` (Task 4). `useScramble(ref, text)` (Task 6) consumed by `SectionHeading` (Task 6). `useTilt(ref, max)` (Task 7) consumed by `ProjectCard` (Task 7). `scrubReveal(targets, trigger, vars)` (Task 9) consumed in Tasks 9 Steps 5–6. gsap mock gains `quickTo` (Task 4) before any hook that calls it runs in tests. Consistent. ✅
