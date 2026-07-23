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
