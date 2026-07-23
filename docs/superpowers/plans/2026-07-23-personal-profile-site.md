# Personal Profile Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Sushant Kumar's single-page, scroll-driven personal profile website in the "dark developer / neon glow" direction — responsive, accessible (WCAG AA), animated with GSAP.

**Architecture:** Vite + React 19 + TypeScript SPA. Content lives in typed data modules (`src/data/`) consumed by presentational section components (`src/sections/`). Shared primitives in `src/components/`. Styling via SCSS modules (`.module.scss`) with a shared variables/mixins layer. Motion via GSAP + ScrollTrigger, wrapped in `useGSAP` and gated by `gsap.matchMedia()` + `prefers-reduced-motion`. Content is always present in the DOM (progressive enhancement); GSAP only animates it.

**Tech Stack:** Vite 8, React 19 (React Compiler), TypeScript, Sass (SCSS modules), GSAP + @gsap/react + ScrollTrigger, lucide-react, Fontsource (JetBrains Mono + Inter), Vitest + @testing-library/react + jest-axe.

## Global Constraints

- **Design direction:** dark developer / neon glow. Colors — bg `#020617`, surface `#0b1020`, ink `#e6f0ff`, muted `#7c8aa8`, accents cyan `#22d3ee` / violet `#a78bfa` / green `#22c55e`. Never pure `#000`.
- **Type:** JetBrains Mono (display/UI), Inter (body). Self-hosted via Fontsource — **no CDN font links**.
- **Styling:** **SCSS only** (`.module.scss`). No plain `.css` files. Each module uses `@use '../../styles/variables' as *;` and `@use '../../styles/mixins' as *;` for tokens/mixins.
- **Icons:** **Lucide (`lucide-react`) for all icons.** No emoji as icons, no inline SVG icons.
- **Accessibility (WCAG AA):** semantic landmarks, logical heading order, visible focus rings, full keyboard nav, skip-to-content link, real `alt` text, decorative layers `aria-hidden`, text contrast ≥ 4.5:1, `prefers-reduced-motion` honored everywhere.
- **Responsive:** mobile-first; no horizontal scroll; fluid type via `clamp()`; verified at 375 / 768 / 1024 / 1440.
- **Projects:** curated featured cards only — **no per-project external/GitHub links** on cards.
- **Deploy:** build for custom-domain root (`base: '/'`), target `sushantk.dev`.
- **Commit style:** conventional commits. Do NOT add any `Co-Authored-By` or Claude/AI attribution trailer to commit messages.

---

## File Structure

```
vite.config.ts                 modify — base '/', scss loadPaths, vitest test block
index.html                     modify — lang, title, meta description, viewport, favicon
src/
  main.tsx                     modify — import global.scss, mount <App/>
  App.tsx                      rewrite — compose sections, scroll reveals, landmarks
  vite-env.d.ts                keep
  test/
    setup.ts                   create — jest-dom + jest-axe matchers, gsap mocks
  styles/
    _variables.scss            create — scss vars (colors, breakpoints map, spacing, type)
    _mixins.scss               create — respond-to, focus-ring, reduced-motion, glow
    global.scss                create — reset, fonts, :root custom props, base body
  lib/
    gsap.ts                    create — register ScrollTrigger + useGSAP re-export
  data/
    profile.ts                 create — name/role/bio/contact/quickFacts + types
    experience.ts              create — timeline entries + type
    projects.ts                create — featured projects + type (NO link field)
    skills.ts                  create — grouped skills + type
  assets/
    avatar.jpg                 add — self-hosted GitHub avatar
  components/
    SkipLink/SkipLink.tsx + .module.scss
    Chip/Chip.tsx + .module.scss
    SectionHeading/SectionHeading.tsx + .module.scss
    GlowBackground/GlowBackground.tsx + .module.scss
    Nav/Nav.tsx + .module.scss
    SocialLinks/SocialLinks.tsx + .module.scss
  sections/
    Hero/Hero.tsx + .module.scss
    About/About.tsx + .module.scss
    Experience/Experience.tsx + .module.scss
    Projects/Projects.tsx + .module.scss
    Skills/Skills.tsx + .module.scss
    Contact/Contact.tsx + .module.scss
```

---

### Task 1: Project setup — dependencies, config, test harness, scaffold cleanup

**Files:**
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json` (scripts — via commands)
- Delete: `src/App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `public/icons.svg`

**Interfaces:**
- Produces: working dev server; `pnpm test` runs Vitest with jsdom + jest-axe; SCSS resolves `@use 'variables'`-style via `loadPaths`.

- [ ] **Step 1: Install dependencies**

```bash
pnpm add gsap @gsap/react lucide-react @fontsource/jetbrains-mono @fontsource-variable/inter
pnpm add -D sass vitest jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event jest-axe @types/jest-axe
```

- [ ] **Step 2: Rewrite `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { fileURLToPath } from 'node:url'

const stylesDir = fileURLToPath(new URL('./src/styles', import.meta.url))

export default defineConfig({
  base: '/',
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  css: {
    preprocessorOptions: {
      scss: { loadPaths: [stylesDir] },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
```

- [ ] **Step 3: Create `src/test/setup.ts`** (jest-dom + jest-axe; mock GSAP so animations no-op in jsdom)

```ts
import '@testing-library/jest-dom/vitest'
import { expect, vi } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// GSAP touches layout APIs jsdom lacks; no-op it in tests. Content renders regardless.
vi.mock('@gsap/react', () => ({ useGSAP: (cb: () => void) => { /* skip effect */ } }))
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
```

- [ ] **Step 4: Add `test` script to `package.json`**

```bash
pnpm pkg set scripts.test="vitest run" scripts.test:watch="vitest"
```

- [ ] **Step 5: Remove default scaffold assets**

```bash
rm -f src/App.css src/assets/react.svg src/assets/vite.svg src/assets/hero.png public/icons.svg
```

- [ ] **Step 6: Verify dev server boots and test runner works**

```bash
pnpm exec vitest run --passWithNoTests
```
Expected: exits 0 ("No test files found, exiting with code 0" / passWithNoTests). Then `pnpm dev` starts without error (Ctrl-C to stop).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: set up deps, vite config, and vitest harness"
```

---

### Task 2: Styles foundation — variables, mixins, global

**Files:**
- Create: `src/styles/_variables.scss`, `src/styles/_mixins.scss`, `src/styles/global.scss`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: SCSS partials importable as `@use 'variables' as *;` / `@use 'mixins' as *;` (via `loadPaths`). CSS custom props on `:root`: `--bg --surface --ink --muted --cyan --violet --green --border --radius --maxw`. Mixins: `respond-to($bp)`, `focus-ring`, `reduced-motion`, `glow-text($color)`.

- [ ] **Step 1: Create `src/styles/_variables.scss`**

```scss
// Palette
$bg: #020617; $surface: #0b1020; $ink: #e6f0ff; $muted: #7c8aa8;
$cyan: #22d3ee; $violet: #a78bfa; $green: #22c55e; $border: #1e2740;

$font-mono: 'JetBrains Mono', ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace;
$font-sans: 'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;

$bp: (sm: 480px, md: 768px, lg: 1024px, xl: 1440px);
$maxw: 1080px;
$ease-out: cubic-bezier(0.16, 1, 0.3, 1);
```

- [ ] **Step 2: Create `src/styles/_mixins.scss`**

```scss
@use 'variables' as *;

@mixin respond-to($bp-name) {
  @media (min-width: map-get($bp, $bp-name)) { @content; }
}
@mixin focus-ring {
  &:focus-visible {
    outline: 2px solid $cyan;
    outline-offset: 3px;
    border-radius: 4px;
  }
}
@mixin reduced-motion {
  @media (prefers-reduced-motion: reduce) { @content; }
}
@mixin glow-text($color: $cyan) {
  color: $color;
  text-shadow: 0 0 24px rgba($color, 0.35);
}
```

- [ ] **Step 3: Create `src/styles/global.scss`** (fonts, reset, tokens, base)

```scss
@use 'variables' as *;
@use 'mixins' as *;

// Self-hosted fonts (no CDN)
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';
@import '@fontsource/jetbrains-mono/700.css';
@import '@fontsource-variable/inter';

:root {
  --bg: #{$bg}; --surface: #{$surface}; --ink: #{$ink}; --muted: #{$muted};
  --cyan: #{$cyan}; --violet: #{$violet}; --green: #{$green}; --border: #{$border};
  --radius: 12px; --maxw: #{$maxw};
}

*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
@include reduced-motion { html { scroll-behavior: auto; } }

body {
  background: var(--bg);
  color: var(--ink);
  font-family: $font-sans;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  overflow-x: hidden;
}
h1, h2, h3 { font-family: $font-mono; line-height: 1.1; text-wrap: balance; }
a { color: inherit; }
img { max-width: 100%; display: block; }
::selection { background: rgba($cyan, 0.3); }
```

- [ ] **Step 4: Update `src/main.tsx` to import global styles**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.scss'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: Verify build compiles SCSS**

```bash
pnpm exec vite build
```
Expected: build succeeds; no Sass errors. (App.tsx is still the scaffold — that's fine for this step.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add SCSS design tokens, mixins, and global styles"
```

---

### Task 3: Content data modules

**Files:**
- Create: `src/data/profile.ts`, `src/data/experience.ts`, `src/data/projects.ts`, `src/data/skills.ts`
- Test: `src/data/data.test.ts`

**Interfaces:**
- Produces:
  - `profile: { name: string; role: string; tagline: string; location: string; bioParagraphs: string[]; quickFacts: {label:string; value:string}[]; contact: { github: string; linkedin: string; site: string; email: string } }`
  - `experience: { company: string; roles: {title:string; period:string; duration:string}[]; }[]`
  - `type Project = { title: string; blurb: string; tech: string[] }` and `projects: Project[]` (**no `link`/`url`/`href` field**)
  - `type SkillGroup = { label: string; items: string[] }` and `skills: SkillGroup[]`

- [ ] **Step 1: Write the failing test — `src/data/data.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { profile } from './profile'
import { experience } from './experience'
import { projects } from './projects'
import { skills } from './skills'

describe('content data', () => {
  it('profile has core fields and contact links', () => {
    expect(profile.name).toBe('Sushant Kumar')
    expect(profile.role.length).toBeGreaterThan(0)
    expect(profile.bioParagraphs.length).toBeGreaterThanOrEqual(1)
    expect(profile.contact.github).toContain('github.com/sushant-kum')
    expect(profile.contact.email).toContain('@')
  })
  it('experience includes Workfabric AI and Soroco', () => {
    const companies = experience.map((e) => e.company)
    expect(companies).toContain('Workfabric AI')
    expect(companies).toContain('Soroco')
  })
  it('projects are curated (4-6) and carry NO external links', () => {
    expect(projects.length).toBeGreaterThanOrEqual(4)
    expect(projects.length).toBeLessThanOrEqual(6)
    for (const p of projects) {
      expect(p.title.length).toBeGreaterThan(0)
      expect(Array.isArray(p.tech)).toBe(true)
      expect(p).not.toHaveProperty('link')
      expect(p).not.toHaveProperty('url')
      expect(p).not.toHaveProperty('href')
    }
  })
  it('skills are grouped', () => {
    expect(skills.length).toBeGreaterThanOrEqual(3)
    expect(skills[0].items.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/data/data.test.ts`
Expected: FAIL — cannot resolve `./profile` etc.

- [ ] **Step 3: Create `src/data/profile.ts`**

```ts
export const profile = {
  name: 'Sushant Kumar',
  role: 'Senior Software Engineer — Full-Stack',
  tagline: 'building interfaces for the web',
  location: 'Bengaluru, India',
  bioParagraphs: [
    'I’m a senior software engineer with a demonstrated history of shipping web products across the stack. Day to day I work in TypeScript with Angular and React on the front end, and Node, Express and Redux behind it.',
    'I care about fast, considered interfaces — the kind that stay responsive and accessible as they scale. I hold a B.E. in Computer Science from Sir M Visvesvaraya Institute of Technology.',
  ],
  quickFacts: [
    { label: 'now', value: 'Workfabric AI' },
    { label: 'based in', value: 'Bengaluru, India' },
    { label: 'focus', value: 'Full-stack web' },
    { label: 'langs', value: 'English, Hindi' },
  ],
  contact: {
    github: 'https://github.com/sushant-kum',
    linkedin: 'https://www.linkedin.com/in/sushant-kum/',
    site: 'https://sushantk.dev',
    email: 'sushant.kum96@gmail.com',
  },
} as const
```

- [ ] **Step 4: Create `src/data/experience.ts`**

```ts
export type Role = { title: string; period: string; duration: string }
export type Company = { company: string; roles: Role[] }

export const experience: Company[] = [
  { company: 'Workfabric AI', roles: [
    { title: 'Senior Software Engineer', period: 'Dec 2025 — Present', duration: '' },
  ]},
  { company: 'Soroco', roles: [
    { title: 'Senior Software Engineer, Product', period: 'Oct 2021 — Dec 2025', duration: '4 yrs 3 mos' },
    { title: 'Software Engineer, Full-Stack', period: 'May 2019 — Oct 2021', duration: '2 yrs 6 mos' },
  ]},
  { company: 'Plankton Solutions', roles: [
    { title: 'Software Engineer', period: 'Oct 2017 — May 2019', duration: '1 yr 8 mos' },
    { title: 'Engineering Intern', period: 'Feb 2017 — Sep 2017', duration: '8 mos' },
  ]},
  { company: 'Bharat Heavy Electricals Ltd (BHEL)', roles: [
    { title: 'Engineering Intern', period: '2015', duration: 'ASP.NET · Oracle' },
  ]},
]
```

- [ ] **Step 5: Create `src/data/projects.ts`** (curated, no links)

```ts
export type Project = { title: string; blurb: string; tech: string[] }

export const projects: Project[] = [
  { title: 'ngx-d3-graphs', blurb: 'An Angular library wrapping D3 to render configurable, reactive charts as drop-in components.', tech: ['Angular', 'D3', 'TypeScript'] },
  { title: 'Weather Radar', blurb: 'A responsive weather dashboard with live conditions, forecasts and a clean data-first layout.', tech: ['Angular', 'SCSS', 'REST'] },
  { title: 'React Chat App', blurb: 'A real-time chat interface exploring React state patterns and snappy, accessible messaging UI.', tech: ['React', 'SCSS', 'Realtime'] },
  { title: 'eslint-config-ngx', blurb: 'A shareable ESLint config codifying consistent linting standards for Angular projects.', tech: ['ESLint', 'JavaScript', 'Tooling'] },
]
```

- [ ] **Step 6: Create `src/data/skills.ts`**

```ts
export type SkillGroup = { label: string; items: string[] }

export const skills: SkillGroup[] = [
  { label: 'Languages', items: ['TypeScript', 'JavaScript', 'HTML', 'CSS/SCSS'] },
  { label: 'Frontend', items: ['Angular', 'React', 'Redux', 'Responsive Design'] },
  { label: 'Backend', items: ['Node.js', 'Express'] },
  { label: 'Tooling', items: ['Git', 'Vite', 'ESLint', 'D3'] },
]
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm exec vitest run src/data/data.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add typed content data modules"
```

---

### Task 4: GSAP lib + shared primitives (SkipLink, Chip, SectionHeading, GlowBackground)

**Files:**
- Create: `src/lib/gsap.ts`
- Create: `src/components/SkipLink/SkipLink.tsx` + `.module.scss`
- Create: `src/components/Chip/Chip.tsx` + `.module.scss`
- Create: `src/components/SectionHeading/SectionHeading.tsx` + `.module.scss`
- Create: `src/components/GlowBackground/GlowBackground.tsx` + `.module.scss`
- Test: `src/components/components.test.tsx`

**Interfaces:**
- Produces:
  - `src/lib/gsap.ts` exports `{ gsap, ScrollTrigger, useGSAP }` with `ScrollTrigger` registered once.
  - `<SkipLink />` → `<a class href="#main">Skip to content</a>`
  - `<Chip>{children}</Chip>` → `<span>` styled chip; optional `variant?: 'cyan'|'violet'|'green'` (default cyan)
  - `<SectionHeading id={string} eyebrow?={string} title={string} />` → `<header>` with `<h2 id>` and optional mono eyebrow
  - `<GlowBackground />` → `aria-hidden` decorative div (grid + blobs)

- [ ] **Step 1: Write the failing test — `src/components/components.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { SkipLink } from './SkipLink/SkipLink'
import { Chip } from './Chip/Chip'
import { SectionHeading } from './SectionHeading/SectionHeading'
import { GlowBackground } from './GlowBackground/GlowBackground'

describe('primitives', () => {
  it('SkipLink targets #main and is a link', () => {
    render(<SkipLink />)
    const link = screen.getByRole('link', { name: /skip to content/i })
    expect(link).toHaveAttribute('href', '#main')
  })
  it('Chip renders its children', () => {
    render(<Chip>React</Chip>)
    expect(screen.getByText('React')).toBeInTheDocument()
  })
  it('SectionHeading renders an h2 with the given id', () => {
    render(<SectionHeading id="skills" title="Skills" eyebrow="// stack" />)
    const h = screen.getByRole('heading', { level: 2, name: 'Skills' })
    expect(h).toHaveAttribute('id', 'skills')
  })
  it('GlowBackground is decorative (aria-hidden) with no a11y violations', async () => {
    const { container } = render(<GlowBackground />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/components.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Create `src/lib/gsap.ts`**

```ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export { gsap, ScrollTrigger, useGSAP }
```

- [ ] **Step 4: Create `src/components/SkipLink/SkipLink.tsx` + `SkipLink.module.scss`**

```tsx
import styles from './SkipLink.module.scss'

export function SkipLink() {
  return <a className={styles.skip} href="#main">Skip to content</a>
}
```

```scss
@use '../../styles/variables' as *;

.skip {
  position: absolute;
  left: 12px;
  top: -60px;
  z-index: 200;
  background: $cyan;
  color: $bg;
  padding: 10px 16px;
  border-radius: 8px;
  font-family: $font-mono;
  font-size: 14px;
  transition: top 0.2s $ease-out;
  &:focus { top: 12px; }
}
```

- [ ] **Step 5: Create `src/components/Chip/Chip.tsx` + `Chip.module.scss`**

```tsx
import styles from './Chip.module.scss'

type Props = { children: React.ReactNode; variant?: 'cyan' | 'violet' | 'green' }

export function Chip({ children, variant = 'cyan' }: Props) {
  return <span className={`${styles.chip} ${styles[variant]}`}>{children}</span>
}
```

```scss
@use '../../styles/variables' as *;

.chip {
  display: inline-flex;
  align-items: center;
  font-family: $font-mono;
  font-size: 13px;
  padding: 7px 13px;
  border-radius: 999px;
  border: 1px solid rgba($cyan, 0.3);
  background: rgba($cyan, 0.05);
  transition: transform 0.2s $ease-out, box-shadow 0.2s $ease-out, background 0.2s $ease-out;
  &:hover { transform: translateY(-2px); box-shadow: 0 0 18px rgba($cyan, 0.35); background: rgba($cyan, 0.14); }
}
.cyan { color: lighten($cyan, 15%); border-color: rgba($cyan, 0.3); }
.violet { color: lighten($violet, 8%); border-color: rgba($violet, 0.32); background: rgba($violet, 0.05);
  &:hover { box-shadow: 0 0 18px rgba($violet, 0.35); background: rgba($violet, 0.14); } }
.green { color: lighten($green, 12%); border-color: rgba($green, 0.32); background: rgba($green, 0.05);
  &:hover { box-shadow: 0 0 18px rgba($green, 0.35); background: rgba($green, 0.14); } }
```

- [ ] **Step 6: Create `src/components/SectionHeading/SectionHeading.tsx` + `SectionHeading.module.scss`**

```tsx
import styles from './SectionHeading.module.scss'

type Props = { id: string; title: string; eyebrow?: string }

export function SectionHeading({ id, title, eyebrow }: Props) {
  return (
    <header className={styles.head}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2 id={id} className={styles.title}>{title}</h2>
    </header>
  )
}
```

```scss
@use '../../styles/variables' as *;

.head { margin-bottom: 40px; }
.eyebrow { font-family: $font-mono; font-size: 13px; letter-spacing: 0.18em; color: $cyan; margin-bottom: 10px; }
.title { font-size: clamp(28px, 5vw, 48px); font-weight: 700; }
```

- [ ] **Step 7: Create `src/components/GlowBackground/GlowBackground.tsx` + `GlowBackground.module.scss`**

```tsx
import styles from './GlowBackground.module.scss'

export function GlowBackground() {
  return (
    <div className={styles.bg} aria-hidden="true">
      <div className={styles.grid} />
      <div className={`${styles.blob} ${styles.cy}`} />
      <div className={`${styles.blob} ${styles.vi}`} />
    </div>
  )
}
```

```scss
@use '../../styles/variables' as *;

.bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(120,160,255,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120,160,255,0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 40%, transparent 100%);
}
.blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.45; animation: drift 18s ease-in-out infinite alternate; }
.cy { width: 420px; height: 420px; background: $cyan; top: 6%; left: -6%; }
.vi { width: 460px; height: 460px; background: $violet; bottom: 0; right: -8%; animation-delay: -6s; }
@keyframes drift { to { transform: translate(60px, -40px) scale(1.15); } }
@media (prefers-reduced-motion: reduce) { .blob { animation: none; } }
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/components.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add gsap lib and shared UI primitives"
```

---

### Task 5: Nav with smooth-scroll anchors

**Files:**
- Create: `src/components/Nav/Nav.tsx` + `Nav.module.scss`
- Test: `src/components/Nav/Nav.test.tsx`

**Interfaces:**
- Consumes: nothing from data.
- Produces: `<Nav />` → `<nav aria-label="Primary">` containing anchor links to `#about #experience #projects #skills #contact`, each with visible text.

- [ ] **Step 1: Write the failing test — `src/components/Nav/Nav.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Nav } from './Nav'

describe('Nav', () => {
  it('renders anchor links to each section', () => {
    render(<Nav />)
    for (const id of ['about', 'experience', 'projects', 'skills', 'contact']) {
      const link = screen.getByRole('link', { name: new RegExp(id, 'i') })
      expect(link).toHaveAttribute('href', `#${id}`)
    }
  })
  it('has no a11y violations', async () => {
    const { container } = render(<Nav />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/components/Nav/Nav.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/Nav/Nav.tsx`**

```tsx
import styles from './Nav.module.scss'

const LINKS = [
  { id: 'about', label: 'about' },
  { id: 'experience', label: 'experience' },
  { id: 'projects', label: 'projects' },
  { id: 'skills', label: 'skills' },
  { id: 'contact', label: 'contact' },
]

export function Nav() {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <a className={styles.brand} href="#top">SK<span>.</span></a>
      <ul className={styles.links}>
        {LINKS.map((l) => (
          <li key={l.id}><a href={`#${l.id}`}>{l.label}</a></li>
        ))}
      </ul>
    </nav>
  )
}
```

- [ ] **Step 4: Create `src/components/Nav/Nav.module.scss`**

```scss
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  font-family: $font-mono;
}
.brand { font-weight: 700; text-decoration: none; span { color: $cyan; } }
.links {
  list-style: none; display: flex; gap: 18px; padding: 0; margin: 0;
  font-size: 14px;
  a { text-decoration: none; color: $muted; transition: color 0.2s $ease-out; @include focus-ring;
      &:hover { color: $ink; } }
  @media (max-width: 480px) { gap: 12px; font-size: 12px; }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/components/Nav/Nav.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add primary nav with smooth-scroll anchors"
```

---

### Task 6: Hero section (typewriter + glow + chips)

**Files:**
- Create: `src/sections/Hero/Hero.tsx` + `Hero.module.scss`
- Test: `src/sections/Hero/Hero.test.tsx`

**Interfaces:**
- Consumes: `profile` (name, role, tagline), `skills` (for chips), `<GlowBackground/>`, `<Chip/>`, `useGSAP/gsap`.
- Produces: `<Hero />` → `<section id="top">` with `<h1>` name, role kicker, a typewriter line whose **static fallback text is always in the DOM**, skill chips, quick meta.

- [ ] **Step 1: Write the failing test — `src/sections/Hero/Hero.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Hero } from './Hero'

describe('Hero', () => {
  it('renders the name as h1 and the role', () => {
    render(<Hero />)
    expect(screen.getByRole('heading', { level: 1, name: /sushant kumar/i })).toBeInTheDocument()
    expect(screen.getByText(/senior software engineer/i)).toBeInTheDocument()
  })
  it('renders skill chips', () => {
    render(<Hero />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
  })
  it('has no a11y violations', async () => {
    const { container } = render(<Hero />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/sections/Hero/Hero.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/sections/Hero/Hero.tsx`**

```tsx
import { useRef, useState } from 'react'
import { useGSAP, gsap } from '../../lib/gsap'
import { GlowBackground } from '../../components/GlowBackground/GlowBackground'
import { Chip } from '../../components/Chip/Chip'
import { profile } from '../../data/profile'
import styles from './Hero.module.scss'

const PHRASES = ['building interfaces for the web', 'shipping full-stack products', 'Angular · React · TypeScript']
const CHIPS = ['TypeScript', 'Angular', 'React', 'Node.js', 'Express', 'Redux']

export function Hero() {
  const root = useRef<HTMLElement>(null)
  const [typed, setTyped] = useState(PHRASES[0])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.reveal}`, {
        opacity: 0, y: 24, duration: 0.7, ease: 'expo.out', stagger: 0.08,
      })
      // typewriter loop
      let pi = 0, ci = 0, del = false
      const tick = () => {
        const w = PHRASES[pi]
        setTyped(w.slice(0, ci))
        if (!del) { ci++; if (ci > w.length) { del = true; return void gsap.delayedCall(1.4, tick) } }
        else { ci--; if (ci === 0) { del = false; pi = (pi + 1) % PHRASES.length } }
        gsap.delayedCall(del ? 0.036 : 0.064, tick)
      }
      const start = gsap.delayedCall(0.8, tick)
      return () => start.kill()
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <section id="top" ref={root} className={styles.hero}>
      <GlowBackground />
      <div className={styles.inner}>
        <p className={`${styles.kicker} ${styles.reveal}`}>// {profile.role.toLowerCase()}</p>
        <h1 className={`${styles.name} ${styles.reveal}`}>{profile.name}</h1>
        <p className={`${styles.term} ${styles.reveal}`}>
          <span className={styles.prompt}>sushant@dev</span> <span className={styles.tilde}>~</span> %{' '}
          <span>{typed}</span><span className={styles.cursor} aria-hidden="true">_</span>
        </p>
        <div className={`${styles.chips} ${styles.reveal}`}>
          {CHIPS.map((c) => <Chip key={c}>{c}</Chip>)}
        </div>
        <p className={`${styles.meta} ${styles.reveal}`}>
          <span>📍 {profile.location}</span>
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create `src/sections/Hero/Hero.module.scss`**

```scss
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.hero { position: relative; min-height: 100vh; display: flex; align-items: center; overflow: hidden; }
.inner { position: relative; z-index: 5; max-width: var(--maxw); margin: 0 auto; padding: 120px 28px 60px; width: 100%; }
.kicker { font-family: $font-mono; font-size: 14px; color: $cyan; letter-spacing: 0.16em; }
.name {
  font-size: clamp(44px, 9vw, 96px); font-weight: 700; line-height: 0.98; margin: 14px 0 6px;
  background: linear-gradient(120deg, #fff, #a5f3fc 40%, #c4b5fd);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 40px rgba(103, 232, 249, 0.15);
}
.term { margin-top: 22px; font-family: $font-mono; font-size: clamp(15px, 2.6vw, 22px); color: $ink; }
.prompt { color: $green; }
.tilde { color: #93c5fd; }
.cursor { display: inline-block; color: $cyan; animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
@include reduced-motion { .cursor { animation: none; } }
.chips { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 26px; }
.meta { margin-top: 24px; font-family: $font-mono; font-size: 14px; color: $muted; }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/sections/Hero/Hero.test.tsx`
Expected: PASS (3 tests). (GSAP is mocked, so `typed` stays at the static fallback and content asserts hold.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add hero section with typewriter and glow"
```

---

### Task 7: About section (bio + self-hosted avatar + quick facts)

**Files:**
- Add: `src/assets/avatar.jpg`
- Create: `src/sections/About/About.tsx` + `About.module.scss`
- Test: `src/sections/About/About.test.tsx`

**Interfaces:**
- Consumes: `profile` (bioParagraphs, quickFacts, location), `<SectionHeading/>`.
- Produces: `<About />` → `<section id="about">` with heading, avatar `<img>` with descriptive alt, bio paragraphs, quick-facts mono list.

- [ ] **Step 1: Add the avatar asset**

```bash
# reuse the already-downloaded avatar if present, else fetch fresh
cp "/tmp/claude-1001/-home-sushant-git-repos-aboutme/4ba06c15-b51f-403b-8986-8f280200014b/scratchpad/av.jpg" src/assets/avatar.jpg 2>/dev/null \
  || curl -sL "https://avatars.githubusercontent.com/u/17355376?v=4&s=480" -o src/assets/avatar.jpg
ls -la src/assets/avatar.jpg
```
Expected: file exists, non-zero size.

- [ ] **Step 2: Write the failing test — `src/sections/About/About.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { About } from './About'

describe('About', () => {
  it('renders heading, avatar with alt, and bio', () => {
    render(<About />)
    expect(screen.getByRole('heading', { level: 2, name: /about/i })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /sushant kumar/i })).toBeInTheDocument()
    expect(screen.getByText(/senior software engineer/i)).toBeInTheDocument()
  })
  it('has no a11y violations', async () => {
    const { container } = render(<About />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm exec vitest run src/sections/About/About.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Create `src/sections/About/About.tsx`**

```tsx
import { useRef } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap'
import { SectionHeading } from '../../components/SectionHeading/SectionHeading'
import { profile } from '../../data/profile'
import avatar from '../../assets/avatar.jpg'
import styles from './About.module.scss'

export function About() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.animate}`, {
        opacity: 0, y: 24, duration: 0.6, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 75%' },
      })
    })
    return () => { mm.revert(); ScrollTrigger.getAll().forEach((t) => t.kill()) }
  }, { scope: root })

  return (
    <section id="about" ref={root} className={styles.about}>
      <div className={styles.inner}>
        <SectionHeading id="about-h" title="About" eyebrow="// whoami" />
        <div className={styles.grid}>
          <img className={`${styles.avatar} ${styles.animate}`} src={avatar}
               width={160} height={160} alt="Sushant Kumar" loading="lazy" />
          <div className={styles.body}>
            {profile.bioParagraphs.map((p, i) => (
              <p key={i} className={styles.animate}>{p}</p>
            ))}
            <dl className={`${styles.facts} ${styles.animate}`}>
              {profile.quickFacts.map((f) => (
                <div key={f.label} className={styles.fact}>
                  <dt>{f.label}</dt><dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Create `src/sections/About/About.module.scss`**

```scss
@use '../../styles/variables' as *;

.about { padding: 100px 0; }
.inner { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
.grid { display: grid; grid-template-columns: 1fr; gap: 32px;
  @media (min-width: 768px) { grid-template-columns: 160px 1fr; gap: 48px; } }
.avatar { border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 0 40px rgba($cyan, 0.12); }
.body { display: flex; flex-direction: column; gap: 18px; max-width: 62ch; color: #c7d2e5; }
.facts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 8px; }
.fact { border-left: 2px solid rgba($cyan, 0.4); padding-left: 12px;
  dt { font-family: $font-mono; font-size: 12px; color: $cyan; letter-spacing: 0.1em; }
  dd { font-size: 15px; margin: 2px 0 0; } }
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm exec vitest run src/sections/About/About.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add about section with avatar and quick facts"
```

---

### Task 8: Experience timeline

**Files:**
- Create: `src/sections/Experience/Experience.tsx` + `Experience.module.scss`
- Test: `src/sections/Experience/Experience.test.tsx`

**Interfaces:**
- Consumes: `experience`, `<SectionHeading/>`.
- Produces: `<Experience />` → `<section id="experience">` with an ordered timeline; each company is a `<li>`, roles listed with period + duration.

- [ ] **Step 1: Write the failing test — `src/sections/Experience/Experience.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Experience } from './Experience'
import { experience } from '../../data/experience'

describe('Experience', () => {
  it('renders every company', () => {
    render(<Experience />)
    for (const e of experience) {
      expect(screen.getByText(e.company)).toBeInTheDocument()
    }
  })
  it('renders as a list', () => {
    render(<Experience />)
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(experience.length)
  })
  it('has no a11y violations', async () => {
    const { container } = render(<Experience />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/sections/Experience/Experience.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/sections/Experience/Experience.tsx`**

```tsx
import { useRef } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap'
import { SectionHeading } from '../../components/SectionHeading/SectionHeading'
import { experience } from '../../data/experience'
import styles from './Experience.module.scss'

export function Experience() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.item}`, {
        opacity: 0, x: -20, duration: 0.5, ease: 'expo.out', stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      })
      gsap.from(`.${styles.line}`, {
        scaleY: 0, transformOrigin: 'top', duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      })
    })
    return () => { mm.revert(); ScrollTrigger.getAll().forEach((t) => t.kill()) }
  }, { scope: root })

  return (
    <section id="experience" ref={root} className={styles.exp}>
      <div className={styles.inner}>
        <SectionHeading id="experience-h" title="Experience" eyebrow="// career --log" />
        <ol className={styles.timeline}>
          <span className={styles.line} aria-hidden="true" />
          {experience.map((c) => (
            <li key={c.company} className={styles.item}>
              <span className={styles.dot} aria-hidden="true" />
              <h3 className={styles.company}>{c.company}</h3>
              <ul className={styles.roles}>
                {c.roles.map((r) => (
                  <li key={r.title + r.period}>
                    <span className={styles.title}>{r.title}</span>
                    <span className={styles.period}>{r.period}{r.duration && ` · ${r.duration}`}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create `src/sections/Experience/Experience.module.scss`**

```scss
@use '../../styles/variables' as *;

.exp { padding: 100px 0; background: linear-gradient(180deg, transparent, rgba($surface, 0.4), transparent); }
.inner { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
.timeline { position: relative; list-style: none; margin: 0; padding: 0 0 0 28px; }
.line { position: absolute; left: 5px; top: 6px; bottom: 6px; width: 2px;
  background: linear-gradient(180deg, $cyan, $violet); border-radius: 2px; }
.item { position: relative; padding: 0 0 34px; }
.dot { position: absolute; left: -27px; top: 6px; width: 12px; height: 12px; border-radius: 50%;
  background: $bg; border: 2px solid $cyan; box-shadow: 0 0 12px rgba($cyan, 0.6); }
.company { font-size: 20px; color: $ink; }
.roles { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px;
  li { display: flex; flex-direction: column; }
  @media (min-width: 768px) { li { flex-direction: row; justify-content: space-between; gap: 16px; } } }
.title { font-size: 15px; color: #c7d2e5; }
.period { font-family: $font-mono; font-size: 13px; color: $muted; }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/sections/Experience/Experience.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add experience timeline section"
```

---

### Task 9: Projects section (curated cards, NO links)

**Files:**
- Create: `src/sections/Projects/Projects.tsx` + `Projects.module.scss`
- Test: `src/sections/Projects/Projects.test.tsx`

**Interfaces:**
- Consumes: `projects`, `<SectionHeading/>`, `<Chip/>`.
- Produces: `<Projects />` → `<section id="projects">` with a card grid; each card shows title, blurb, tech chips. **No `<a>` inside the section.**

- [ ] **Step 1: Write the failing test — `src/sections/Projects/Projects.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Projects } from './Projects'
import { projects } from '../../data/projects'

describe('Projects', () => {
  it('renders every featured project title', () => {
    render(<Projects />)
    for (const p of projects) expect(screen.getByText(p.title)).toBeInTheDocument()
  })
  it('contains NO links (cards are showcase-only)', () => {
    const { container } = render(<Projects />)
    const section = container.querySelector('#projects')!
    expect(within(section as HTMLElement).queryByRole('link')).toBeNull()
    expect((section as HTMLElement).querySelectorAll('a').length).toBe(0)
  })
  it('has no a11y violations', async () => {
    const { container } = render(<Projects />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/sections/Projects/Projects.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/sections/Projects/Projects.tsx`**

```tsx
import { useRef } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap'
import { SectionHeading } from '../../components/SectionHeading/SectionHeading'
import { Chip } from '../../components/Chip/Chip'
import { projects } from '../../data/projects'
import styles from './Projects.module.scss'

export function Projects() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.card}`, {
        opacity: 0, y: 24, scale: 0.96, duration: 0.5, ease: 'back.out(1.4)', stagger: 0.08,
        scrollTrigger: { trigger: root.current, start: 'top 75%' },
      })
    })
    return () => { mm.revert(); ScrollTrigger.getAll().forEach((t) => t.kill()) }
  }, { scope: root })

  return (
    <section id="projects" ref={root} className={styles.projects}>
      <div className={styles.inner}>
        <SectionHeading id="projects-h" title="Projects" eyebrow="// selected work" />
        <ul className={styles.grid}>
          {projects.map((p) => (
            <li key={p.title} className={styles.card}>
              <h3 className={styles.title}>{p.title}</h3>
              <p className={styles.blurb}>{p.blurb}</p>
              <div className={styles.tech}>
                {p.tech.map((t) => <Chip key={t} variant="violet">{t}</Chip>)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create `src/sections/Projects/Projects.module.scss`**

```scss
@use '../../styles/variables' as *;

.projects { padding: 100px 0; }
.inner { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
.grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 20px;
  grid-template-columns: 1fr;
  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); } }
.card {
  background: rgba($surface, 0.6); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 24px; transition: border-color 0.2s $ease-out, transform 0.2s $ease-out, box-shadow 0.2s $ease-out;
  &:hover { border-color: rgba($violet, 0.5); transform: translateY(-4px); box-shadow: 0 12px 40px rgba($violet, 0.14); }
}
.title { font-size: 18px; color: $ink; }
.blurb { color: #b9c4da; font-size: 15px; margin: 10px 0 16px; }
.tech { display: flex; flex-wrap: wrap; gap: 8px; }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/sections/Projects/Projects.test.tsx`
Expected: PASS (3 tests) — critically, the "NO links" test confirms the spec constraint.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add curated projects section (showcase-only, no links)"
```

---

### Task 10: Skills section

**Files:**
- Create: `src/sections/Skills/Skills.tsx` + `Skills.module.scss`
- Test: `src/sections/Skills/Skills.test.tsx`

**Interfaces:**
- Consumes: `skills`, `<SectionHeading/>`, `<Chip/>`.
- Produces: `<Skills />` → `<section id="skills">` with a group per `SkillGroup`, each group labeled and listing its items as chips.

- [ ] **Step 1: Write the failing test — `src/sections/Skills/Skills.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Skills } from './Skills'
import { skills } from '../../data/skills'

describe('Skills', () => {
  it('renders each group label and a sample item', () => {
    render(<Skills />)
    for (const g of skills) expect(screen.getByText(g.label)).toBeInTheDocument()
    expect(screen.getByText('Angular')).toBeInTheDocument()
  })
  it('has no a11y violations', async () => {
    const { container } = render(<Skills />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/sections/Skills/Skills.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/sections/Skills/Skills.tsx`**

```tsx
import { useRef } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap'
import { SectionHeading } from '../../components/SectionHeading/SectionHeading'
import { Chip } from '../../components/Chip/Chip'
import { skills } from '../../data/skills'
import styles from './Skills.module.scss'

export function Skills() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.group}`, {
        opacity: 0, y: 20, duration: 0.5, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 78%' },
      })
    })
    return () => { mm.revert(); ScrollTrigger.getAll().forEach((t) => t.kill()) }
  }, { scope: root })

  return (
    <section id="skills" ref={root} className={styles.skills}>
      <div className={styles.inner}>
        <SectionHeading id="skills-h" title="Skills" eyebrow="// stack" />
        <div className={styles.groups}>
          {skills.map((g) => (
            <div key={g.label} className={styles.group}>
              <h3 className={styles.label}>{g.label}</h3>
              <div className={styles.items}>
                {g.items.map((i) => <Chip key={i} variant="green">{i}</Chip>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Create `src/sections/Skills/Skills.module.scss`**

```scss
@use '../../styles/variables' as *;

.skills { padding: 100px 0; }
.inner { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
.groups { display: grid; gap: 28px; grid-template-columns: 1fr;
  @media (min-width: 640px) { grid-template-columns: repeat(2, 1fr); } }
.group { }
.label { font-family: $font-mono; font-size: 13px; letter-spacing: 0.14em; color: $green; margin-bottom: 14px; }
.items { display: flex; flex-wrap: wrap; gap: 9px; }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/sections/Skills/Skills.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add skills section"
```

---

### Task 11: Contact / footer with Lucide social links

**Files:**
- Create: `src/components/SocialLinks/SocialLinks.tsx` + `SocialLinks.module.scss`
- Create: `src/sections/Contact/Contact.tsx` + `Contact.module.scss`
- Test: `src/sections/Contact/Contact.test.tsx`

**Interfaces:**
- Consumes: `profile.contact`, Lucide icons (`Github`, `Linkedin`, `Globe`, `Mail`).
- Produces:
  - `<SocialLinks />` → list of `<a>` each with an `aria-label` and Lucide icon (`aria-hidden` on the svg).
  - `<Contact />` → `<footer id="contact">` with a "let's talk" prompt + `<SocialLinks/>`.

- [ ] **Step 1: Write the failing test — `src/sections/Contact/Contact.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Contact } from './Contact'

describe('Contact', () => {
  it('renders accessible social links with correct hrefs', () => {
    render(<Contact />)
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute('href', 'https://github.com/sushant-kum')
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute('href', 'https://www.linkedin.com/in/sushant-kum/')
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute('href', 'mailto:sushant.kum96@gmail.com')
  })
  it('has no a11y violations', async () => {
    const { container } = render(<Contact />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/sections/Contact/Contact.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/components/SocialLinks/SocialLinks.tsx`**

```tsx
import { Github, Linkedin, Globe, Mail } from 'lucide-react'
import { profile } from '../../data/profile'
import styles from './SocialLinks.module.scss'

const LINKS = [
  { label: 'GitHub', href: profile.contact.github, Icon: Github },
  { label: 'LinkedIn', href: profile.contact.linkedin, Icon: Linkedin },
  { label: 'Website', href: profile.contact.site, Icon: Globe },
  { label: 'Email', href: `mailto:${profile.contact.email}`, Icon: Mail },
]

export function SocialLinks() {
  return (
    <ul className={styles.list}>
      {LINKS.map(({ label, href, Icon }) => {
        const external = href.startsWith('http')
        return (
          <li key={label}>
            <a className={styles.link} href={href} aria-label={label}
               {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              <Icon className={styles.icon} aria-hidden="true" focusable="false" size={20} />
              <span>{label}</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 4: Create `src/components/SocialLinks/SocialLinks.module.scss`**

```scss
@use '../../styles/variables' as *;
@use '../../styles/mixins' as *;

.list { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 14px; }
.link {
  display: inline-flex; align-items: center; gap: 9px;
  font-family: $font-mono; font-size: 14px; text-decoration: none; color: $muted;
  padding: 10px 16px; border: 1px solid var(--border); border-radius: 999px;
  transition: color 0.2s $ease-out, border-color 0.2s $ease-out, box-shadow 0.2s $ease-out;
  @include focus-ring;
  &:hover { color: $ink; border-color: rgba($cyan, 0.5); box-shadow: 0 0 18px rgba($cyan, 0.22); }
}
.icon { color: $cyan; }
```

- [ ] **Step 5: Create `src/sections/Contact/Contact.tsx`**

```tsx
import { useRef } from 'react'
import { useGSAP, gsap, ScrollTrigger } from '../../lib/gsap'
import { SocialLinks } from '../../components/SocialLinks/SocialLinks'
import { profile } from '../../data/profile'
import styles from './Contact.module.scss'

export function Contact() {
  const root = useRef<HTMLElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(`.${styles.animate}`, {
        opacity: 0, y: 24, duration: 0.6, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 80%' },
      })
    })
    return () => { mm.revert(); ScrollTrigger.getAll().forEach((t) => t.kill()) }
  }, { scope: root })

  return (
    <footer id="contact" ref={root} className={styles.contact}>
      <div className={styles.inner}>
        <p className={`${styles.eyebrow} ${styles.animate}`}>// get in touch</p>
        <h2 className={`${styles.title} ${styles.animate}`}>Let’s build something.</h2>
        <p className={`${styles.sub} ${styles.animate}`}>
          Open to conversations about full-stack product engineering — say hello.
        </p>
        <div className={styles.animate}><SocialLinks /></div>
        <p className={`${styles.copy} ${styles.animate}`}>
          © {new Date().getFullYear()} {profile.name} · Bengaluru, India
        </p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 6: Create `src/sections/Contact/Contact.module.scss`**

```scss
@use '../../styles/variables' as *;

.contact { padding: 110px 0 70px; border-top: 1px solid var(--border);
  background: radial-gradient(ellipse 60% 80% at 50% 0%, rgba($cyan, 0.06), transparent); }
.inner { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
.eyebrow { font-family: $font-mono; font-size: 13px; color: $cyan; letter-spacing: 0.16em; }
.title { font-size: clamp(30px, 6vw, 56px); font-weight: 700; margin: 12px 0 16px; }
.sub { color: #b9c4da; max-width: 52ch; margin-bottom: 28px; }
.copy { margin-top: 40px; font-family: $font-mono; font-size: 12px; color: $muted; }
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm exec vitest run src/sections/Contact/Contact.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add contact footer with Lucide social links"
```

---

### Task 12: Assemble App, page shell, full-page a11y, production build

**Files:**
- Rewrite: `src/App.tsx`
- Modify: `index.html`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: all sections + `SkipLink`, `Nav`.
- Produces: `<App />` → `SkipLink`, `Nav`, `<main id="main">` wrapping Hero/About/Experience/Projects/Skills, then `Contact` footer.

- [ ] **Step 1: Write the failing test — `src/App.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import App from './App'

describe('App', () => {
  it('renders one main landmark and all section headings', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /sushant kumar/i })).toBeInTheDocument()
    for (const name of [/about/i, /experience/i, /projects/i, /skills/i]) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument()
    }
  })
  it('the whole page has no a11y violations', async () => {
    const { container } = render(<App />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/App.test.tsx`
Expected: FAIL — App still exports the scaffold (no `main`, no headings).

- [ ] **Step 3: Rewrite `src/App.tsx`**

```tsx
import { SkipLink } from './components/SkipLink/SkipLink'
import { Nav } from './components/Nav/Nav'
import { Hero } from './sections/Hero/Hero'
import { About } from './sections/About/About'
import { Experience } from './sections/Experience/Experience'
import { Projects } from './sections/Projects/Projects'
import { Skills } from './sections/Skills/Skills'
import { Contact } from './sections/Contact/Contact'

export default function App() {
  return (
    <>
      <SkipLink />
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
      </main>
      <Contact />
    </>
  )
}
```

- [ ] **Step 4: Update `index.html`** (lang, title, meta, viewport already present — add description + theme-color; keep favicon)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#020617" />
    <meta name="description" content="Sushant Kumar — Senior Software Engineer, Full-Stack. Angular, React, TypeScript. Based in Bengaluru, India." />
    <title>Sushant Kumar — Senior Software Engineer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/App.test.tsx`
Expected: PASS (2 tests) — including full-page axe.

- [ ] **Step 6: Run the whole suite + typecheck + production build**

```bash
pnpm exec vitest run && pnpm exec tsc -b && pnpm exec vite build
```
Expected: all tests pass; no TS errors; `dist/` built with no CDN font requests.

- [ ] **Step 7: Manual verification checklist (run `pnpm dev`)**
  - [ ] Resize to 375 / 768 / 1024 / 1440 — no horizontal scroll; layout holds.
  - [ ] Tab through the page — skip link appears on first Tab; focus rings visible on nav + links.
  - [ ] Nav anchors smooth-scroll to sections.
  - [ ] Enable OS "reduce motion" — reload: no typewriter loop, no scroll animations, content fully visible.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: assemble app shell, landmarks, and page metadata"
```

---

### Task 13: Deployment config (GitHub Pages → sushantk.dev)

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `public/CNAME`
- Modify: `README.md`

**Interfaces:**
- Produces: CI that builds and deploys `dist/` to GitHub Pages on push to `main`, served at `sushantk.dev`.

- [ ] **Step 1: Create `public/CNAME`** (Vite copies `public/` to `dist/` root)

```
sushantk.dev
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Replace scaffold `README.md`** with a real project README

```markdown
# sushantk.dev — Personal Profile Site

Single-page personal profile for Sushant Kumar. Dark developer / neon aesthetic,
animated with GSAP, responsive and WCAG AA accessible.

## Stack
Vite · React 19 · TypeScript · SCSS modules · GSAP + ScrollTrigger · lucide-react

## Develop
```bash
pnpm install
pnpm dev        # local dev server
pnpm test       # vitest + jest-axe
pnpm build      # production build to dist/
```

## Deploy
Pushing to `main` builds and deploys to GitHub Pages, served at **sushantk.dev**
(see `.github/workflows/deploy.yml` and `public/CNAME`). In the repo settings,
set **Pages → Build and deployment → Source = GitHub Actions**, and point the
`sushantk.dev` DNS at GitHub Pages.

## Editing content
All copy lives in `src/data/` (`profile.ts`, `experience.ts`, `projects.ts`,
`skills.ts`). Edit those to update the site.
```

- [ ] **Step 4: Verify the build still produces CNAME**

```bash
pnpm exec vite build && test -f dist/CNAME && cat dist/CNAME
```
Expected: prints `sushantk.dev`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add Pages deploy workflow, CNAME, and README"
```

---

## Self-Review

**Spec coverage:**
- Hero/About/Experience/Projects/Skills/Contact → Tasks 6–11 ✓
- Single-page + nav + smooth scroll → Tasks 5, 12 ✓
- Dark/neon visual system + tokens → Task 2 ✓
- JetBrains Mono + Inter self-hosted (no CDN) → Task 2 (Fontsource) ✓
- SCSS only → all component tasks use `.module.scss` ✓
- Lucide icons → Task 11 (SocialLinks) ✓ (only icons in the design are social)
- GSAP + ScrollTrigger + matchMedia + reduced-motion → Tasks 4, 6–11 ✓
- Accessibility (landmarks, skip link, focus rings, alt text, axe tests) → Tasks 4, 7, 12 ✓
- Responsive (clamp, mobile-first, breakpoint checks) → all SCSS + Task 12 checklist ✓
- Curated projects, NO links → Task 9 (with an explicit test asserting zero links) ✓
- Deploy to sushantk.dev root → Tasks 1 (`base: '/'`), 13 (CNAME + workflow) ✓
- Content from LinkedIn → Task 3 ✓

**Placeholder scan:** No TBD/TODO; every code step contains full code. ✓
**Type consistency:** `Project` has no link field (Task 3) and Task 9's test enforces it; `profile.contact` keys (`github/linkedin/site/email`) match usage in SocialLinks (Task 11) and tests; `styles.reveal`/`styles.animate`/`styles.item`/`styles.card`/`styles.group` class hooks match their GSAP selectors within each task. ✓
