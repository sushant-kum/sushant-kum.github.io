# Design — Sushant Kumar Personal Profile Website

**Date:** 2026-07-23
**Status:** Approved
**Direction:** Dark developer / neon glow

## 1. Goal

A beautiful, animated, modern personal profile website for Sushant Kumar (Senior
Software Engineer, Full-Stack). Single-page, scroll-driven experience with a
distinctive "developer terminal" aesthetic. **Responsive** and **accessible
(WCAG AA)** are hard requirements, not afterthoughts.

## 2. Content source

Real content from Sushant's LinkedIn profile (no placeholders). See canonical
facts below.

- **Name:** Sushant Kumar
- **Title:** Senior Software Engineer – Product (Full-Stack) · Angular / React / Express
- **Location:** Bengaluru, India
- **Summary:** Experienced senior software engineer with a demonstrated history in
  the software industry; skilled in web development across Node, Angular, React,
  Redux, Express. B.E. Computer Science, Sir M Visvesvaraya Institute of Technology.
- **Top skills:** TypeScript, Responsive Web Design, Front-End Development
- **Languages:** English, Hindi
- **Certifications:** CSS / HTML / JavaScript Fundamentals; The Ultimate Redux Course
- **Links:** github.com/sushant-kum · linkedin.com/in/sushant-kum · sushantk.dev ·
  sushant.kum96@gmail.com

**Experience timeline:**
- Workfabric AI — Senior Software Engineer (Dec 2025–present)
- Soroco — 6y 8m: Senior Software Engineer, Product (Oct 2021–Dec 2025); Senior SWE
  Full-Stack (Oct 2021–Aug 2022); Software Engineer, Full-Stack (May 2019–Oct 2021)
- Plankton Solutions — Software Engineer (Oct 2017–May 2019); Engineering Intern (Feb–Sep 2017)
- Studentphase — Digital Marketing Intern (Feb–May 2016)
- BHEL — Engineering Intern (Jul 2015; Jan 2015)

**Education:** B.E. Computer Science, Sir M Visvesvaraya Institute of Technology
(2013–2017); Kendriya Vidyalaya (2001–2013)

## 3. Page structure (single-page, scroll anchors)

Fixed minimal top nav with smooth-scroll anchors + a skip-to-content link.

1. **Hero** — terminal-style intro: name, animated typewriter role line, skill
   chips, ambient cyan/violet glow, faint grid, blinking cursor.
2. **About** — short narrative bio + avatar, location, current role, a mono
   "quick facts" block.
3. **Experience** — vertical timeline (Workfabric AI → Soroco → Plankton →
   internships): role, dates, duration; scroll-reveals; timeline line "draws" on scroll.
4. **Projects** — curated **featured** project cards (~4–6 hand-picked, e.g.
   `ngx-d3-graphs`, `weather-radar`, `react-chat-app`, `eslint-config-ngx`) with
   polished descriptions + tech tags. **No per-project GitHub links** — showcase
   cards only.
5. **Skills** — grouped tech stack (Languages / Frontend / Backend / Tooling) as
   glowing chips / compact grid.
6. **Contact / footer** — a "let's talk" prompt + Lucide social icons (GitHub,
   LinkedIn, blog, email). The GitHub profile link lives here (not on project cards).

## 4. Visual system (design tokens)

- **Color:** bg `#020617`, surface `#0b1020`, ink `#e6f0ff`, muted `#7c8aa8`;
  accents cyan `#22d3ee`, violet `#a78bfa`, green `#22c55e` (terminal/success).
  Neutrals deliberately biased slightly toward blue. Avoid pure `#000` (OLED smear).
- **Type:** JetBrains Mono for display/UI accents; a clean sans (Inter or system
  stack) for body readability. Self-hosted / inlined via Vite bundling — no CDN,
  so no font flash or silent fallback.
- **Texture:** faint grid, drifting blurred glow blobs, thin borders, subtle
  scanline — all decorative layers `aria-hidden`.

## 5. Motion (GSAP + ScrollTrigger)

- Hero load: staggered reveal + typewriter; easing `expo.out` / cubic-bezier(0.16,1,0.3,1).
- Section reveals on scroll: fade + ~20px rise, staggered.
- Experience timeline line draws as it enters; chips glow on hover.
- **All motion gated behind `gsap.matchMedia()` + `prefers-reduced-motion`** →
  instant, no-motion fallback path.
- Durations 150–800ms depending on element; motion conveys spatial meaning, not decoration.

## 6. Tech stack

- **Base (existing):** Vite + React 19 + TypeScript + React Compiler, pnpm.
- **Add:** `gsap` (core + ScrollTrigger), `lucide-react` (all icons), `sass`.
- **Styling:** **SCSS** via `.module.scss` component modules + a shared tokens/
  mixins layer. **No plain CSS.**
- **Structure:** component-per-section under `src/sections/`, shared UI under
  `src/components/`, tokens/mixins under `src/styles/`, content data under
  `src/data/` (typed content objects so copy is editable in one place).

## 7. Accessibility (WCAG AA) — required

- Semantic landmarks (`header`/`nav`/`main`/`section`/`footer`), logical heading order.
- Visible focus rings; full keyboard navigation; skip-to-content link.
- Real `alt` text; decorative layers `aria-hidden`.
- Contrast ≥ 4.5:1 for text (verify accent-on-dark; cyan/violet used for large/UI, not body).
- `prefers-reduced-motion` honored everywhere.

## 8. Responsive — required

- Mobile-first. Verified at 375 / 768 / 1024 / 1440.
- No horizontal scroll; fluid type via `clamp()`; viewport meta; zoom not disabled.

## 9. Deployment

- Build for **custom domain root** (`base: '/'`) for `sushantk.dev`; works on
  GitHub Pages with a CNAME. Static Vite build.

## 10. Out of scope (YAGNI)

- No live GitHub API fetch (curated static project data instead).
- No CMS, blog, or backend.
- No per-project external links.
- No multi-page routing.
