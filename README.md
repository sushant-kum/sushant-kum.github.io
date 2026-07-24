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

Pushing to `main` builds once and publishes the same artifact to **both**
GitHub Pages (served at **sushantk.dev**) and Firebase Hosting `prod`
(`aboutme-sushant`), in parallel — see `.github/workflows/deploy.yml`. Pull
requests get a Firebase `testbed` preview deploy with the URL commented on the
PR (`.github/workflows/ci.yml`). Firebase targets live in `.firebaserc` /
`firebase.json`.

For GitHub Pages: in repo settings set **Pages → Build and deployment →
Source = GitHub Actions**, point the `sushantk.dev` DNS at GitHub Pages, and
keep `public/CNAME`. For Firebase: the deploy jobs need the
`FIREBASE_SERVICE_ACCOUNT_ABOUTME_SUSHANT` repository secret.

## Editing content

All copy lives in `src/data/` (`profile.ts`, `experience.ts`, `projects.ts`,
`skills.ts`). Edit those to update the site.
