# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-page personal profile site for Sushant Kumar (sushantk.dev). Dark
developer / neon aesthetic, GSAP-animated, responsive, WCAG AA accessible.
Stack: Vite · React 19 · TypeScript · SCSS modules · GSAP + ScrollTrigger.

## Commands

Package manager is **pnpm** (enforced via `engines`/`packageManager` — do not use npm/yarn).

```bash
pnpm dev                 # local dev server (Vite)
pnpm build               # tsc -b + SSG build to dist/ (this is the deploy artifact)
pnpm preview             # serve the built dist/
pnpm test                # vitest run (one-shot; includes jest-axe a11y checks)
pnpm test:watch          # vitest watch mode
pnpm typecheck           # tsc -b (project references)
pnpm lint                # eslint .   (lint:fix, lint:error = --quiet)
pnpm stylelint           # stylelint SCSS   (stylelint:fix, stylelint:error)
pnpm format:check        # prettier -c .    (format:fix = --write)
pnpm secretlint          # scan for secrets
pnpm spellcheck          # cspell (config in cspell.json)
pnpm knip                # unused files/exports/deps
```

Run a single test file or filter by name:

```bash
pnpm test src/sections/Hero/Hero.test.tsx
pnpm exec vitest run -t "renders skill chips"
```

The CI quality gate (`.github/workflows/ci.yml`) runs, in order: `typecheck`,
`lint:error`, `stylelint:error`, `secretlint`, `test`. Match it locally before pushing.

Commits use Conventional Commits (commitlint + husky); use `pnpm tool::commit` (commitizen).

## Architecture

**Content is data-driven.** All site copy lives in `src/data/*.ts`
(`profile.ts`, `experience.ts`, `projects.ts`, `skills.ts`), each exported `as const`.
To change what the site says, edit these — not the section components.

**Composition.** `src/App.tsx` assembles the page from `src/sections/*` (Hero,
About, Experience, Projects, Skills, Contact) plus shared `src/components/*`
(Nav, SkipLink, SocialLinks, SectionHeading, Chip, GlowBackground). Each section
and component is a folder with co-located `Name.tsx`, `Name.module.scss`, and
`Name.test.tsx`.

**Rendering is SSG, not CSR.** `src/main.tsx` exports `createRoot` via
`ViteReactSSG` (`vite-react-ssg/single-page`) — `pnpm build` prerenders static
HTML that hydrates on the client. Any code that touches `window`/`document` at
module load or render must guard for its absence on the server (see below).

**React Compiler is on** via `babel-plugin-react-compiler` (`vite.config.ts`).
Follow the Rules of React; do not hand-add `useMemo`/`useCallback` for perf.

**GSAP is centralized** in `src/lib/gsap.ts`, which registers plugins behind a
`typeof window !== 'undefined'` guard (SSG safety) and re-exports
`gsap`, `ScrollTrigger`, `useGSAP`. Always import from `../../lib/gsap`, never
from `gsap` directly. Section animation pattern (see `Experience.tsx`):
`useGSAP(..., { scope: root })`, wrap tweens in
`gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', ...)` so motion
is skipped for users who opt out, and in the cleanup return `mm.revert()` +
kill ScrollTriggers.

**Hydration-safe dynamic values.** Values that differ between build and runtime
must not diverge during hydration. The copyright year uses a `__BUILD_YEAR__`
global (defined in `vite.config.ts`, typed in `src/vite-env.d.ts`) as the
server/build fallback, then reads the live client year via `useSyncExternalStore`
(see `Contact.tsx`). Reuse this pattern for similar cases.

**Styling.** Per-component SCSS modules. Shared tokens/mixins live in
`src/styles/_variables.scss` and `_mixins.scss`; `vite.config.ts` adds `src/styles`
to Sass `loadPaths`, so `@use` them by bare name (no relative paths). Global
resets/base in `src/styles/global.scss`.

## Testing

Vitest + jsdom + Testing Library, with `jest-axe` for a11y. `src/test/setup.ts`
mocks GSAP/`useGSAP`/`ScrollTrigger` and `matchMedia` (jsdom lacks the layout
APIs), so tests assert rendered content and accessibility, not animation. Every
section/component ships a test that includes an `axe(container)` no-violations
check — keep this when adding UI.

## Deployment

`pnpm build` produces `dist/`. On push to `main`, `.github/workflows/deploy.yml`
builds once and publishes the same artifact to **both** GitHub Pages (sushantk.dev)
and Firebase Hosting `prod` (`aboutme-sushant`). PRs get a Firebase `testbed`
preview deploy with the URL commented on the PR. Firebase targets are configured
in `.firebaserc` / `firebase.json`.

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                             | Use when                                               |
| -------------------------------- | ------------------------------------------------------ |
| `detect_changes_tool`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context_tool`        | Need source snippets for review — token-efficient      |
| `get_impact_radius_tool`         | Understanding blast radius of a change                 |
| `get_affected_flows_tool`        | Finding which execution paths are impacted             |
| `query_graph_tool`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview_tool` | Understanding high-level codebase structure            |
| `refactor_tool`                  | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
