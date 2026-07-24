## Summary

<!-- What does this PR do and why? Add `Closes #123` if it resolves an issue. -->

## Type of change

- [ ] `feat` — new feature or capability
- [ ] `fix` — bug fix
- [ ] `refactor` — no behaviour change
- [ ] `chore` — tooling / deps / config
- [ ] `docs` — documentation only
- [ ] `style` — formatting / whitespace
- [ ] `perf` — performance
- [ ] `ci` — CI/CD (`.github/workflows/`)
- [ ] `build` — build system
- [ ] `test` — tests only

## Areas touched

- [ ] Section(s) — `src/sections/` (hero, about, experience, projects, skills, contact)
- [ ] Shared component(s) — `src/components/` (nav, chip, section-heading, skip-link, glow-background, social-links)
- [ ] Content data — `src/data/`
- [ ] Motion / GSAP — `src/lib/gsap.ts`, scroll animations
- [ ] Styles — `src/styles/` tokens/mixins or `*.module.scss`
- [ ] SSG / build — `vite-react-ssg` entry, `vite.config.ts`, prerender
- [ ] Tooling / config — ESLint, Prettier, Stylelint, knip, cspell, commitlint
- [ ] CI / deploy — `.github/workflows/`, Firebase hosting
- [ ] Dependencies — `package.json` / `pnpm-lock.yaml`

## Accessibility (WCAG AA)

<!-- Tick if UI changed; N/A otherwise. -->

- [ ] Keyboard navigable with a visible focus ring
- [ ] `prefers-reduced-motion` honoured (no un-gated animation)
- [ ] Semantic landmarks / heading order preserved; real `alt` text
- [ ] `pnpm test` a11y (jest-axe) passes — no violations
- [ ] N/A — no UI change

## SSG / prerender

<!-- Tick if render output could change; N/A otherwise. -->

- [ ] `pnpm build` prerenders real content into `dist/index.html` (not an empty root)
- [ ] No hydration mismatch (browser-only APIs stay inside effects / guarded)
- [ ] N/A

## Dependencies

<!-- Tick if package.json changed; N/A otherwise. -->

- [ ] `pnpm-lock.yaml` is committed
- [ ] `pnpm tool::check-engines` passes
- [ ] N/A — no dependency changes

## Verification

- [ ] `pnpm lint:error` — no errors
- [ ] `pnpm format:check` — clean
- [ ] `pnpm stylelint` — clean (if styles changed)
- [ ] `pnpm spellcheck` — clean
- [ ] `pnpm knip` — no new dead code / unused deps
- [ ] `pnpm secretlint` — no committed secrets
- [ ] `pnpm test` — all tests pass
- [ ] `pnpm build` — SSG build + prerender succeeds

## Manual test plan

<!-- Concrete steps a reviewer can follow (e.g. `pnpm preview`, resize to 375/768/1440, tab through, toggle reduced motion). -->

## Deployment notes

<!-- Firebase hosting: `pnpm deploy:testbed` (hosting:testbed) vs `pnpm deploy:prod` (hosting:prod); or the GitHub Pages workflow on push to main. Note anything deploy-affecting. -->

## Reviewer notes

<!-- Anything non-obvious worth calling out. -->
