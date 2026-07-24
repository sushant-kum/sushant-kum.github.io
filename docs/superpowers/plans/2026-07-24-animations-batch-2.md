# Immersive Animations Batch 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add eight further animations (preloader, hero name reveal, project glare, stat count-up, nav indicator, skill fill sweep, scroll skew, cursor labels) + a data-driven stats strip, on top of the existing motion layer, without regressing SSG/a11y/reduced-motion/first-paint.

**Architecture:** New effects are isolated co-located components/hooks reusing the existing system. GSAP (incl. newly-registered SplitText) only via `src/lib/gsap.ts`; Three only via `src/lib/three.ts`. Every effect gates on `prefers-reduced-motion` and (where pointer-driven) `pointer: fine`, degrading to a static equivalent.

**Tech Stack:** Vite · React 19 · TypeScript · SCSS modules · GSAP + ScrollTrigger + SplitText · Three.js · Vitest + Testing Library + jest-axe.

## Global Constraints

- Package manager **pnpm** — never npm/yarn.
- GSAP imports only from `src/lib/gsap.ts`; Three only from `src/lib/three.ts`.
- Every decorative overlay/cursor/glare/indicator layer is `aria-hidden="true"` and `pointer-events: none` where it overlays content.
- Every new component/hook ships a test including `expect(await axe(container)).toHaveNoViolations()`.
- Every motion effect skipped under `prefers-reduced-motion: reduce`; reduced-motion result == the calm static equivalent. Pointer-driven effects also require `pointer: fine`.
- Preloader must be safe with JS disabled/broken (pure-CSS auto-dismiss is the source of truth).
- Stats are the honest figures in `src/data/stats.ts`; no fabricated skill scores.
- CI gate stays green in order: `pnpm typecheck`, `lint:error`, `stylelint:error`, `secretlint`, `test`.
- Palette (`src/styles/_variables.scss`): bg `#020617`, cyan `#22d3ee`, violet `#a78bfa`, ink `#e6f0ff`, muted `#7c8aa8`, border `#1e2740`. Mixins (`_mixins.scss`): `respond-to($bp)`, `focus-ring`, `reduced-motion`, `glow-text` (there is NO `mq` mixin).
- Conventional Commits. Branch `feat/immersive-animations`.
- The test mocks live in `src/test/setup.ts`: `gsap` (with `to/from/fromTo/set/timeline/registerPlugin/matchMedia/context/quickTo`), `gsap/ScrollTrigger` (`ScrollTrigger.create()` returns `{}` — cleanups MUST guard `.kill?.()`), and `matchMedia` returns `matches:false`. jsdom never fires ScrollTrigger `onEnter`/`onUpdate`/`onToggle`.

---

## Task 1: Register SplitText + gsap mock + `stats.ts`

**Files:**

- Modify: `src/lib/gsap.ts`
- Modify: `src/test/setup.ts`
- Create: `src/data/stats.ts`
- Test: `src/lib/gsap.test.ts`, `src/data/stats.test.ts`

**Interfaces:**

- Produces: `SplitText` re-exported from `src/lib/gsap.ts`.
- Produces: `stats: Stat[]` and `type Stat = { value: number; suffix?: string; label: string }` from `src/data/stats.ts`.

- [ ] **Step 1: Add SplitText mock to test setup**

In `src/test/setup.ts`, add a mock for the SplitText subpath (SplitText mutates the DOM; the mock is an inert class):

```ts
vi.mock('gsap/SplitText', () => ({
  SplitText: class {
    chars: never[] = [];
    lines: never[] = [];
    words: never[] = [];
    revert() {}
  },
}));
```

- [ ] **Step 2: Write failing tests**

Create `src/lib/gsap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

import { gsap, ScrollTrigger, SplitText } from './gsap';

describe('lib/gsap', () => {
  it('re-exports gsap, ScrollTrigger and SplitText', () => {
    expect(gsap).toBeDefined();
    expect(ScrollTrigger).toBeDefined();
    expect(SplitText).toBeDefined();
  });
});
```

Create `src/data/stats.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

import { stats } from './stats';

describe('stats data', () => {
  it('has four positive-valued stats with labels', () => {
    expect(stats).toHaveLength(4);
    for (const s of stats) {
      expect(s.value).toBeGreaterThan(0);
      expect(s.label.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm exec vitest run src/lib/gsap.test.ts src/data/stats.test.ts`
Expected: FAIL — `SplitText` not exported / `./stats` missing.

- [ ] **Step 4: Implement**

Replace `src/lib/gsap.ts` with:

```ts
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Guard for SSG/prerender: registration touches `window`, which is absent in Node.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
```

Create `src/data/stats.ts`:

```ts
export type Stat = { value: number; suffix?: string; label: string };

export const stats: Stat[] = [
  { value: 7, suffix: '+', label: 'years shipping' },
  { value: 4, label: 'companies' },
  { value: 4, label: 'featured projects' },
  { value: 14, label: 'technologies' },
];
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm exec vitest run src/lib/gsap.test.ts src/data/stats.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck + commit**

Run: `pnpm typecheck` (expect clean).

```bash
git add src/lib/gsap.ts src/lib/gsap.test.ts src/test/setup.ts src/data/stats.ts src/data/stats.test.ts
git commit -m "feat(anim): register SplitText and add stats data"
```

---

## Task 2: Boot-sequence preloader (`Preloader`)

**Files:**

- Create: `src/components/Preloader/Preloader.tsx`
- Create: `src/components/Preloader/Preloader.module.scss`
- Test: `src/components/Preloader/Preloader.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**

- Produces: `Preloader` — full-screen `aria-hidden` terminal overlay that auto-dismisses via CSS (JS enhances with typing + early skip). Mounted first in `App`.

- [ ] **Step 1: Write the failing test**

Create `src/components/Preloader/Preloader.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { Preloader } from './Preloader';

describe('Preloader', () => {
  it('renders an aria-hidden overlay', () => {
    const { container } = render(<Preloader />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Preloader />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/Preloader/Preloader.test.tsx`
Expected: FAIL — cannot resolve `./Preloader`.

- [ ] **Step 3: Write the SCSS module**

Create `src/components/Preloader/Preloader.module.scss`:

```scss
@use 'variables' as *;

.overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg;
  font-family: $font-mono;
  color: $ink;
  // Pure-CSS auto-dismiss so content is never trapped if JS never runs.
  animation: preloader-hide 0.6s ease 1.6s forwards;
}

.dismissed {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.4s ease,
    visibility 0s linear 0.4s;
  animation: none;
}

.term {
  width: min(90vw, 460px);
  font-size: clamp(13px, 2.4vw, 16px);
  line-height: 1.7;
}

.line {
  white-space: pre-wrap;
}

.caret {
  color: $cyan;
}

@keyframes preloader-hide {
  to {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .overlay {
    display: none;
  }
}
```

- [ ] **Step 4: Write the component**

Create `src/components/Preloader/Preloader.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';

import styles from './Preloader.module.scss';

const LINES = ['$ initializing sushantk.dev', '$ loading modules … ok', '$ booting interface'];

export const Preloader = () => {
  const root = useRef<HTMLDivElement>(null);
  const out = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDismissed(true);
      return;
    }
    const target = out.current;
    if (!target) return;

    let li = 0;
    let ci = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const type = () => {
      if (li >= LINES.length) return;
      const line = LINES[li];
      target.textContent = LINES.slice(0, li).join('\n') + (li ? '\n' : '') + line.slice(0, ci);
      ci += 1;
      if (ci > line.length) {
        li += 1;
        ci = 0;
        timers.push(setTimeout(type, 160));
      } else {
        timers.push(setTimeout(type, 34));
      }
    };
    timers.push(setTimeout(type, 120));

    const dismiss = () => setDismissed(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    const el = root.current;
    el?.addEventListener('click', dismiss);
    window.addEventListener('keydown', onKey);

    return () => {
      timers.forEach(clearTimeout);
      el?.removeEventListener('click', dismiss);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      ref={root}
      className={`${styles.overlay} ${dismissed ? styles.dismissed : ''}`}
      aria-hidden="true"
    >
      <div className={styles.term}>
        <div ref={out} className={styles.line} />
        <span className={styles.caret}>▍</span>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/Preloader/Preloader.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Mount in App**

In `src/App.tsx`, add `import { Preloader } from './components/Preloader/Preloader';` and render `<Preloader />` as the FIRST child of the fragment (before `<CursorGlow />`).

- [ ] **Step 7: Run components suite + typecheck + commit**

Run: `pnpm exec vitest run src/components && pnpm typecheck`
Expected: PASS / clean.

```bash
git add src/components/Preloader/ src/App.tsx
git commit -m "feat(anim): add boot-sequence preloader with css auto-dismiss"
```

---

## Task 3: Hero name reveal + shimmer

**Files:**

- Modify: `src/sections/Hero/Hero.tsx`
- Modify: `src/sections/Hero/Hero.module.scss`
- Test: `src/sections/Hero/Hero.test.tsx` (must stay green)

**Interfaces:**

- Consumes: `SplitText` from `src/lib/gsap.ts`.

- [ ] **Step 1: Confirm Hero test green baseline**

Run: `pnpm exec vitest run src/sections/Hero/Hero.test.tsx`
Expected: PASS.

- [ ] **Step 2: Add SplitText name reveal in Hero.tsx**

In `src/sections/Hero/Hero.tsx`:

- Add `SplitText` to the gsap import: `import { useGSAP, gsap, SplitText } from '../../lib/gsap';`
- Add a ref for the name: `const nameRef = useRef<HTMLHeadingElement>(null);` and put `ref={nameRef}` on the `<h1 className={`${styles.name} ${styles.reveal}`}>`.
- Inside the existing `mm.add('(prefers-reduced-motion: no-preference)', () => { ... })` block, BEFORE the `.reveal` `gsap.from`, add:

```tsx
let split: InstanceType<typeof SplitText> | null = null;
if (nameRef.current) {
  split = new SplitText(nameRef.current, { type: 'chars' });
  gsap.from(split.chars, {
    yPercent: 120,
    opacity: 0,
    ease: 'expo.out',
    duration: 0.9,
    stagger: 0.03,
    delay: 3.4,
  });
}
```

- In that same matchMedia callback's returned cleanup, revert the split so the DOM `<h1>` text is restored (add to the existing cleanup, or add one if none): ensure the callback returns `() => { split?.revert(); }`. If the callback already returns a cleanup (typewriter), call `split?.revert()` inside it too.

> The `.name` already has `delay: 3.4` semantics via the reveal; the char animation uses the same 3.4 delay so it lands with the text fade-in.

- [ ] **Step 3: Add the shimmer keyframes to Hero.module.scss**

In `src/sections/Hero/Hero.module.scss`, extend the `.name` rule: change its `background` to include a moving highlight and animate `background-position`. Replace the existing `background: linear-gradient(120deg, #fff, #a5f3fc 40%, #c4b5fd);` with:

```scss
background: linear-gradient(120deg, #fff 0%, #a5f3fc 30%, #e0f7ff 45%, #a5f3fc 60%, #c4b5fd 100%);
background-size: 220% 100%;
```

and add, after the existing `text-shadow` line inside `.name`:

```scss
animation: name-shimmer 6s ease-in-out infinite;
```

Then add at the bottom of the file:

```scss
@keyframes name-shimmer {
  0%,
  100% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 0%;
  }
}

@include reduced-motion {
  .name {
    animation: none;
  }
}
```

- [ ] **Step 4: Run Hero tests**

Run: `pnpm exec vitest run src/sections/Hero/Hero.test.tsx`
Expected: PASS — the mocked `SplitText` is inert and the mocked `useGSAP` skips the effect, so the `<h1>` name text is unchanged and still queryable.

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm typecheck` (clean).

```bash
git add src/sections/Hero/Hero.tsx src/sections/Hero/Hero.module.scss
git commit -m "feat(hero): split-reveal the name on load and add a gradient shimmer"
```

---

## Task 4: Stat count-up (`useCountUp` + `StatStrip`)

**Files:**

- Create: `src/hooks/useCountUp.ts`
- Create: `src/components/StatStrip/StatStrip.tsx`
- Create: `src/components/StatStrip/StatStrip.module.scss`
- Test: `src/hooks/useCountUp.test.tsx`, `src/components/StatStrip/StatStrip.test.tsx`
- Modify: `src/sections/About/About.tsx`

**Interfaces:**

- Produces: `useCountUp(ref: RefObject<HTMLElement | null>, target: number, opts?: { suffix?: string; duration?: number }): void`.
- Produces: `StatStrip` — renders `stats` with count-up values.

- [ ] **Step 1: Write failing hook test**

Create `src/hooks/useCountUp.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useCountUp } from './useCountUp';

const Host = () => {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, 7, { suffix: '+' });
  return <span ref={ref}>7+</span>;
};

describe('useCountUp', () => {
  it('shows the final value immediately (no ScrollTrigger enter in jsdom)', () => {
    const { getByText } = render(<Host />);
    expect(getByText('7+')).toBeInTheDocument();
  });
  it('has no a11y violations', async () => {
    const { container } = render(<Host />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm exec vitest run src/hooks/useCountUp.test.tsx`
Expected: FAIL — cannot resolve `./useCountUp`.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useCountUp.ts`:

```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm exec vitest run src/hooks/useCountUp.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Write StatStrip test**

Create `src/components/StatStrip/StatStrip.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';

import { StatStrip } from './StatStrip';

describe('StatStrip', () => {
  it('renders each stat label', () => {
    render(<StatStrip />);
    expect(screen.getByText('years shipping')).toBeInTheDocument();
    expect(screen.getByText('companies')).toBeInTheDocument();
    expect(screen.getByText('technologies')).toBeInTheDocument();
  });
  it('has no a11y violations', async () => {
    const { container } = render(<StatStrip />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 6: Run to verify fail**

Run: `pnpm exec vitest run src/components/StatStrip/StatStrip.test.tsx`
Expected: FAIL — cannot resolve `./StatStrip`.

- [ ] **Step 7: Write StatStrip scss**

Create `src/components/StatStrip/StatStrip.module.scss`:

```scss
@use 'variables' as *;

.strip {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
}

.stat {
  display: flex;
  flex-direction: column;
}

.value {
  font-family: $font-mono;
  font-size: clamp(24px, 5vw, 36px);
  font-weight: 700;
  color: $cyan;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.label {
  font-family: $font-mono;
  font-size: 13px;
  color: $muted;
  margin-top: 6px;
}
```

- [ ] **Step 8: Write StatStrip component**

Create `src/components/StatStrip/StatStrip.tsx`:

```tsx
import { useRef } from 'react';

import styles from './StatStrip.module.scss';
import { stats, type Stat } from '../../data/stats';
import { useCountUp } from '../../hooks/useCountUp';

const StatItem = ({ value, suffix, label }: Stat) => {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value, { suffix });
  return (
    <li className={styles.stat}>
      <span ref={ref} className={styles.value}>
        {value}
        {suffix ?? ''}
      </span>
      <span className={styles.label}>{label}</span>
    </li>
  );
};

export const StatStrip = () => (
  <ul className={styles.strip}>
    {stats.map((s) => (
      <StatItem key={s.label} {...s} />
    ))}
  </ul>
);
```

- [ ] **Step 9: Run StatStrip test to verify pass**

Run: `pnpm exec vitest run src/components/StatStrip/StatStrip.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 10: Mount in About**

In `src/sections/About/About.tsx`: add `import { StatStrip } from '../../components/StatStrip/StatStrip';`. After the `<dl className={`${styles.facts} ${styles.animate}`}>…</dl>` block (still inside `.body`), add:

```tsx
<div className={styles.animate}>
  <StatStrip />
</div>
```

- [ ] **Step 11: Run About + full component suites, typecheck, commit**

Run: `pnpm exec vitest run src/sections/About src/components/StatStrip src/hooks && pnpm typecheck`
Expected: PASS / clean.

```bash
git add src/hooks/useCountUp.ts src/hooks/useCountUp.test.tsx src/components/StatStrip/ src/sections/About/About.tsx
git commit -m "feat(about): add a by-the-numbers stat strip with count-up"
```

---

## Task 5: Project card glare (`useGlare`)

**Files:**

- Create: `src/hooks/useGlare.ts`
- Test: `src/hooks/useGlare.test.tsx`
- Modify: `src/sections/Projects/Projects.tsx`, `src/sections/Projects/Projects.module.scss`

**Interfaces:**

- Produces: `useGlare(ref: RefObject<HTMLElement | null>, enabled?: boolean): void` — sets `--mx`/`--my`/`--glare` CSS vars from the pointer; no-op on touch/reduced-motion.

> Scope note: implement the cursor-following glare highlight (the high-impact effect). The "rotating gradient border" from the spec is intentionally simplified to the glare highlight plus the existing hover edge-glow, to avoid fragile `@property`/`mask-composite` CSS. Note this in the report.

- [ ] **Step 1: Write failing hook test**

Create `src/hooks/useGlare.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useGlare } from './useGlare';

const Host = () => {
  const ref = useRef<HTMLDivElement>(null);
  useGlare(ref);
  return <div ref={ref}>card</div>;
};

describe('useGlare', () => {
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

- [ ] **Step 2: Run to verify fail**

Run: `pnpm exec vitest run src/hooks/useGlare.test.tsx`
Expected: FAIL — cannot resolve `./useGlare`.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useGlare.ts`:

```ts
import { useEffect, type RefObject } from 'react';

/** Track the pointer as CSS vars for a glare highlight. No-op on touch/reduced motion. */
export const useGlare = (ref: RefObject<HTMLElement | null>, enabled = true) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const onMove = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((ev.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--my', `${((ev.clientY - r.top) / r.height) * 100}%`);
      el.style.setProperty('--glare', '1');
    };
    const onLeave = () => el.style.setProperty('--glare', '0');
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, enabled]);
};
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm exec vitest run src/hooks/useGlare.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Wire into ProjectCard**

In `src/sections/Projects/Projects.tsx`: add `import { useGlare } from '../../hooks/useGlare';`. In the `ProjectCard` component, add `useGlare(ref)` right after the existing `useTilt(ref)`, and add `data-cursor="view"` to the `<li>` (this also feeds Task 9's cursor label). No other markup change.

- [ ] **Step 6: Add the glare layer to Projects.module.scss**

In `src/sections/Projects/Projects.module.scss`, add to the existing `.card` rule (merge, do not duplicate the selector): ensure it has `overflow: hidden;` (add if absent). Then add a glare pseudo-element after the `.card` rule:

```scss
.card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  opacity: var(--glare, 0);
  transition: opacity 0.3s ease;
  background: radial-gradient(
    circle at var(--mx, 50%) var(--my, 50%),
    rgb(34 211 238 / 18%),
    transparent 45%
  );
}
```

> If `.card` sets `overflow: hidden`, confirm the batch-1 tilt still reads fine (tilt is a transform, unaffected by overflow). If the card content relied on visible overflow, use `overflow: clip` instead.

- [ ] **Step 7: Run Projects suite + stylelint + typecheck + commit**

Run: `pnpm exec vitest run src/sections/Projects src/hooks && pnpm stylelint:error && pnpm typecheck`
Expected: PASS / clean.

```bash
git add src/hooks/useGlare.ts src/hooks/useGlare.test.tsx src/sections/Projects/
git commit -m "feat(projects): add cursor-following glare highlight to cards"
```

---

## Task 6: Skill fill sweep

**Files:**

- Modify: `src/sections/Skills/Skills.tsx`, `src/sections/Skills/Skills.module.scss`
- Test: existing `src/sections/Skills/Skills.test.tsx` stays green.

- [ ] **Step 1: Add the sweep tween in Skills.tsx**

In `src/sections/Skills/Skills.tsx`, inside the existing `mm.add('(prefers-reduced-motion: no-preference)', () => { ... })` block (after the existing `scrubReveal(...)` call), add a staggered sweep of the chip spans via an animated CSS var:

```tsx
gsap.fromTo(
  `.${styles.items} > span`,
  { '--sweep': 0 },
  {
    '--sweep': 1,
    duration: 0.7,
    ease: 'power2.out',
    stagger: 0.04,
    immediateRender: false,
    scrollTrigger: { trigger: root.current, start: 'top 78%' },
  },
);
```

(`immediateRender: false` prevents the from-state showing before the trigger fires.)

- [ ] **Step 2: Add the sweep styling to Skills.module.scss**

In `src/sections/Skills/Skills.module.scss`, add rules targeting the chip spans inside `.items` (chips render as `<span>`), giving them a clipped sweeping highlight driven by `--sweep` (default `1` = at rest, off-screen, so no-JS/reduced-motion show plain chips):

```scss
.items > span {
  position: relative;
  overflow: hidden;
}

.items > span::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(100deg, transparent 30%, rgb(34 211 238 / 55%) 50%, transparent 70%);
  transform: translateX(calc(-100% + var(--sweep, 1) * 200%));
}
```

- [ ] **Step 3: Run Skills suite + stylelint + typecheck**

Run: `pnpm exec vitest run src/sections/Skills && pnpm stylelint:error && pnpm typecheck`
Expected: PASS / clean (gsap mocked → no sweep in jsdom; chips still render their text).

- [ ] **Step 4: Commit**

```bash
git add src/sections/Skills/
git commit -m "feat(skills): add a decorative neon fill sweep to skill chips on scroll-in"
```

---

## Task 7: Nav sliding indicator + hide/show

**Files:**

- Modify: `src/components/Nav/Nav.tsx`, `src/components/Nav/Nav.module.scss`
- Test: existing `src/components/Nav/Nav.test.tsx` / component suite stays green.

**Interfaces:**

- Consumes: existing `active` section state (batch 1) + `ScrollTrigger`.

- [ ] **Step 1: Update Nav.tsx**

Replace `src/components/Nav/Nav.tsx` with (keeps the batch-1 active-section ScrollTriggers; adds a sliding indicator + scroll hide/show):

```tsx
import { useEffect, useRef, useState } from 'react';

import styles from './Nav.module.scss';
import { gsap, ScrollTrigger } from '../../lib/gsap';

const LINKS = [
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'projects', label: 'projects' },
  { id: 'skills', label: 'skills' },
  { id: 'contact', label: 'contact' },
];

export const Nav = () => {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState<string>('');

  // active-section tracking (batch 1)
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

  // slide the indicator under the active link
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const list = listRef.current;
    const ind = indicatorRef.current;
    if (!list || !ind) return;
    const activeEl = list.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (!activeEl) {
      gsap.set(ind, { opacity: 0 });
      return;
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const vars = { x: activeEl.offsetLeft, width: activeEl.offsetWidth, opacity: 1 };
    if (reduce) gsap.set(ind, vars);
    else gsap.to(ind, { ...vars, duration: 0.4, ease: 'power3.out' });
  }, [active]);

  // hide on scroll-down, show on scroll-up
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nav = navRef.current;
    if (!nav) return;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self: { direction: number; scroll: () => number }) => {
        const hide = self.direction === 1 && self.scroll() > 120;
        gsap.to(nav, { yPercent: hide ? -130 : 0, duration: 0.3, ease: 'power2.out' });
      },
    });
    return () => st.kill?.();
  }, []);

  return (
    <nav ref={navRef} className={styles.nav} aria-label="Primary">
      <a className={styles.brand} href="#top">
        SK<span>.</span>
      </a>
      <ul ref={listRef} className={styles.links}>
        {LINKS.map((l) => (
          <li key={l.id}>
            <a
              href={`#${l.id}`}
              data-id={l.id}
              className={active === l.id ? styles.active : undefined}
              aria-current={active === l.id ? 'true' : undefined}
            >
              {l.label}
            </a>
          </li>
        ))}
        <span ref={indicatorRef} className={styles.indicator} aria-hidden="true" />
      </ul>
    </nav>
  );
};
```

- [ ] **Step 2: Update Nav.module.scss**

In `src/components/Nav/Nav.module.scss`: ensure `.links` has `position: relative;` (add if absent). Add:

```scss
.indicator {
  position: absolute;
  bottom: -4px;
  left: 0;
  height: 2px;
  width: 0;
  opacity: 0;
  pointer-events: none;
  border-radius: 2px;
  background: linear-gradient(90deg, $cyan, $violet);
  box-shadow: 0 0 8px rgb(34 211 238 / 60%);
}
```

(Keep the existing `.active` rule from batch 1.)

- [ ] **Step 3: Run component suite + stylelint + typecheck**

Run: `pnpm exec vitest run src/components && pnpm stylelint:error && pnpm typecheck`
Expected: PASS / clean — Nav still renders all 5 links; the indicator `<span>` is `aria-hidden` and doesn't affect link queries; `gsap`/`ScrollTrigger` mocks make the effects inert.

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav/
git commit -m "feat(nav): add sliding active indicator and hide-on-scroll-down"
```

---

## Task 8: Scroll-velocity skew (`useScrollSkew`)

**Files:**

- Create: `src/hooks/useScrollSkew.ts`
- Test: `src/hooks/useScrollSkew.test.tsx`
- Modify: `src/App.tsx`, `src/styles/global.scss`

**Interfaces:**

- Produces: `useScrollSkew(ref: RefObject<HTMLElement | null>, max?: number): void` — skews the element by clamped scroll velocity, easing back to 0 at rest; no-op under reduced motion.

- [ ] **Step 1: Write failing hook test**

Create `src/hooks/useScrollSkew.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { useRef } from 'react';
import { describe, it, expect } from 'vitest';

import { useScrollSkew } from './useScrollSkew';

const Host = () => {
  const ref = useRef<HTMLDivElement>(null);
  useScrollSkew(ref);
  return <div ref={ref}>content</div>;
};

describe('useScrollSkew', () => {
  it('renders its host without throwing', () => {
    const { getByText } = render(<Host />);
    expect(getByText('content')).toBeInTheDocument();
  });
  it('has no a11y violations', async () => {
    const { container } = render(<Host />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

- [ ] **Step 2: Run to verify fail**

Run: `pnpm exec vitest run src/hooks/useScrollSkew.test.tsx`
Expected: FAIL — cannot resolve `./useScrollSkew`.

- [ ] **Step 3: Implement the hook**

Create `src/hooks/useScrollSkew.ts`:

```ts
import { useEffect, type RefObject } from 'react';

import { gsap, ScrollTrigger } from '../lib/gsap';

/** Skew an element by clamped scroll velocity, easing back to 0 at rest. */
export const useScrollSkew = (ref: RefObject<HTMLElement | null>, max = 3) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const setSkew = gsap.quickTo(el, 'skewY', { duration: 0.5, ease: 'power3.out' });
    let reset: ReturnType<typeof gsap.delayedCall> | null = null;
    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self: { getVelocity: () => number }) => {
        const v = Math.max(-max, Math.min(max, self.getVelocity() / -350));
        setSkew(v);
        reset?.kill();
        reset = gsap.delayedCall(0.15, () => setSkew(0));
      },
    });
    return () => {
      reset?.kill();
      st.kill?.();
      gsap.set(el, { skewY: 0 });
    };
  }, [ref, max]);
};
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm exec vitest run src/hooks/useScrollSkew.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Apply in App + prevent horizontal overflow**

In `src/App.tsx`: import the hook (`import { useScrollSkew } from './hooks/useScrollSkew';`), add a ref for `<main>` (`const mainRef = useRef<HTMLElement>(null);` — add `import { useRef } from 'react';`), attach `ref={mainRef}` to the existing `<main id="main">`, and call `useScrollSkew(mainRef);` in the component body. (App becomes a function body with the hook; keep the existing children/order.)

In `src/styles/global.scss`, ensure the body can't gain a horizontal scrollbar from the skew — add `overflow-x: clip;` to the `body` rule (add the declaration to the existing `body` selector; do not duplicate the selector).

- [ ] **Step 6: Run full suite + stylelint + typecheck + commit**

Run: `pnpm exec vitest run && pnpm stylelint:error && pnpm typecheck`
Expected: PASS / clean.

```bash
git add src/hooks/useScrollSkew.ts src/hooks/useScrollSkew.test.tsx src/App.tsx src/styles/global.scss
git commit -m "feat(anim): add subtle scroll-velocity skew to the main content"
```

---

## Task 9: Cursor context labels + scroll-reactive particles

**Files:**

- Modify: `src/components/CursorGlow/CursorGlow.tsx`, `src/components/CursorGlow/CursorGlow.module.scss`
- Modify: `src/components/ParticleHero/ParticleHero.tsx`
- Modify: `src/components/SocialLinks/SocialLinks.tsx` (add `data-cursor="open"`)
- Test: component suite stays green.

- [ ] **Step 1: Add a label layer to CursorGlow.tsx**

In `src/components/CursorGlow/CursorGlow.tsx`:

- Add a label ref: `const label = useRef<HTMLDivElement>(null);`
- Add quickTo for the label position alongside the ring, inside the effect:

```tsx
const lx = gsap.quickTo(label.current, 'x', { duration: 0.2, ease: 'power2.out' });
const ly = gsap.quickTo(label.current, 'y', { duration: 0.2, ease: 'power2.out' });
```

- In `onMove`, also drive the label: add `lx(ev.clientX); ly(ev.clientY);`
- Replace the `onOver`/`onOut` handlers so a `data-cursor` element sets the label text and shows it:

```tsx
const onOver = (ev: PointerEvent) => {
  const t = ev.target;
  const labelled = t instanceof Element ? t.closest<HTMLElement>('[data-cursor]') : null;
  if (labelled && label.current) {
    label.current.textContent = labelled.dataset.cursor ?? '';
    label.current.classList.add(styles.labelShow);
    r.classList.add(styles.active);
  } else if (interactive(ev.target)) {
    r.classList.add(styles.active);
  }
};
const onOut = (ev: PointerEvent) => {
  const t = ev.target;
  if (t instanceof Element && t.closest('[data-cursor]') && label.current) {
    label.current.classList.remove(styles.labelShow);
  }
  if (interactive(ev.target)) r.classList.remove(styles.active);
};
```

- Render the label element alongside the dot/ring (aria-hidden):

```tsx
<div ref={label} className={styles.label} aria-hidden="true" />
```

- [ ] **Step 2: Add label styles to CursorGlow.module.scss**

Add:

```scss
.label {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  margin: 14px 0 0 14px;
  padding: 2px 8px;
  font-family: $font-mono;
  font-size: 11px;
  letter-spacing: 0.05em;
  color: $bg;
  background: $cyan;
  border-radius: 4px;
  pointer-events: none;
  opacity: 0;
  transform: scale(0.8);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.labelShow {
  opacity: 1;
  transform: scale(1);
}

@media (pointer: coarse) {
  .label {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .label {
    display: none;
  }
}
```

- [ ] **Step 3: Add data-cursor to SocialLinks**

In `src/components/SocialLinks/SocialLinks.tsx`, add `data-cursor="open"` to each external anchor (the mapped link `<a>`). Do not change hrefs, labels, or icon markup. (Project cards already got `data-cursor="view"` in Task 5.)

- [ ] **Step 4: Add scroll reactivity to ParticleHero.tsx**

In `src/components/ParticleHero/ParticleHero.tsx`, inside the `loadThree().then((THREE) => { ... })` block after the pointer listener is set up:

- Add a scroll-velocity accumulator and listener:

```tsx
let scrollBoost = 0;
let lastScrollY = window.scrollY;
const onScroll = () => {
  const y = window.scrollY;
  scrollBoost += Math.min(0.4, Math.abs(y - lastScrollY) * 0.004);
  lastScrollY = y;
};
window.addEventListener('scroll', onScroll, { passive: true });
cleanups.push(() => window.removeEventListener('scroll', onScroll));
```

- In the `frame` function, apply and decay the boost where the rotation is set. Change the existing `points.rotation.y = Math.sin(e * 0.1) * 0.15 + drf * e * 0.02;` line to:

```tsx
points.rotation.y = Math.sin(e * 0.1) * 0.15 + drf * e * 0.02 + scrollBoost;
scrollBoost *= 0.92;
```

- [ ] **Step 5: Run component suite + stylelint + typecheck**

Run: `pnpm exec vitest run src/components && pnpm stylelint:error && pnpm typecheck`
Expected: PASS / clean (CursorGlow effect inert in jsdom; ParticleHero still bails without a 2D context; SocialLinks still renders its links/labels).

- [ ] **Step 6: Commit**

```bash
git add src/components/CursorGlow/ src/components/ParticleHero/ParticleHero.tsx src/components/SocialLinks/SocialLinks.tsx
git commit -m "feat(cursor): add context labels and scroll-reactive hero particles"
```

---

## Task 10: Verify, polish, final review

**Files:** none created; verification only.

- [ ] **Step 1: Full CI gate**

Run: `pnpm typecheck && pnpm lint:error && pnpm stylelint:error && pnpm secretlint && pnpm test`
Expected: all pass. Fix failures before continuing.

- [ ] **Step 2: Build + code-split check**

Run: `pnpm build` (expect success). Confirm the `three` chunk is still code-split:

```bash
ls -1 dist/assets/*.js | xargs -n1 basename
```

Expected: a distinct `three.module-*.js` chunk separate from the app entry.

- [ ] **Step 3: Manual browser smoke test (defer to user if headless)**

`pnpm preview`, then verify: preloader types + wipes on load; hero name splits in + shimmers; project cards glare under the cursor + show a "view" label; stat strip counts up on scroll; nav indicator slides + nav hides on scroll-down; skill chips sweep; page skews subtly on fast scroll; particles react to scroll. Toggle OS reduce-motion → reload: preloader absent, no name split/shimmer, no glare/labels/skew, static stats/skills, nav static — the calm site.

- [ ] **Step 4: Commit any polish, then the branch is ready for final review.**

```bash
git add -A && git commit -m "chore(anim): batch-2 polish and verification" || echo "nothing to commit"
```

---

## Self-Review

**Spec coverage:** Preloader → T2. Hero name reveal + shimmer → T3. Project glare → T5 (rotating border simplified, noted). Stat count-up → T1(data)+T4. Nav indicator + hide/show → T7. Skill fill sweep → T6. Scroll skew → T8. Cursor labels + scroll-reactive particles → T9. SplitText registration + gsap mock → T1. Stats data → T1. All covered.

**Placeholder scan:** The `overflow: hidden` note in T5 and the "add if absent" notes (T7 `.links` position, T8 `body` overflow) require reading the current file, but each gives the exact declaration and a concrete fallback — not vague directives.

**Type consistency:** `SplitText` (T1) consumed in T3. `Stat`/`stats` (T1) consumed in T4. `useCountUp(ref, target, {suffix,duration})` (T4) consumed by `StatStrip` (T4). `useGlare(ref, enabled)` (T5) consumed by `ProjectCard`. `useScrollSkew(ref, max)` (T8) consumed in App. `data-cursor` set in T5 (cards) + T9 (social links), read by CursorGlow in T9. Consistent.
