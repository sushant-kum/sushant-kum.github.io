---
name: create-pr
description: Create a Pull Request on GitHub for the current branch using the gh CLI. Use when the user says "create a PR", "open a PR", or "raise a pull request".
---

# Create PR

Create a pull request on GitHub for the current branch, using the project PR template.

## Constants

- **Owner:** `sushant-kum`
- **Repository:** `aboutme`
- **Target branch:** `main` (unless the user specifies otherwise)
- **PR template:** `.github/pull_request_template.md`

## Prerequisites (check first, stop if unmet)

This repo has **no GitHub MCP plugin** available, so PRs are created with the
**`gh` CLI** (`gh pr create`). Before doing anything else, confirm:

- `command -v gh` — the `gh` CLI is installed. If not, stop and tell the user to
  install and authenticate it (`gh auth login`); do not attempt a workaround.
- `git remote -v` — an `origin` remote exists. If there is no remote, stop and
  tell the user to add one (`git remote add origin git@github.com:sushant-kum/aboutme.git`)
  and push `main` first — a PR cannot be opened without a remote.

## Workflow

### Step 1: Gather context

Run these in parallel:

- `git branch --show-current` — current branch name
- `git status` — check for uncommitted changes
- `git log main..HEAD --oneline` — commits that will be in the PR
- `git diff main...HEAD --stat` — files changed vs main

If there are uncommitted changes, warn the user and ask if they want to commit first (use the `/commit` command) or proceed without them.

If the current branch is `main`, stop and tell the user to create a feature branch first.

### Step 2: Ensure branch is pushed

`gh pr create` opens the PR from the **remote** head branch, so the branch must
exist on `origin` and be up to date first.

- Run `git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null` to check if the branch tracks a remote.
- If no upstream exists, ask the user for confirmation then push: `git push -u origin <branch>`
- If upstream exists, check if local is ahead: `git status -sb`. If ahead, ask the user to confirm push, then `git push`.

### Step 3: Analyze changes and draft PR content

Read the full diff against main (`git diff main...HEAD`) and the commit log.

Determine:

- **Type of change** — `feat`, `fix`, `refactor`, `chore`, `docs`, `ci`, etc.
- **Areas touched** — which parts of this single-page site are affected:
  section component(s) under `src/sections/`, shared component(s) under
  `src/components/`, content data (`src/data/`), motion/GSAP
  (`src/lib/gsap.ts`), styles (`src/styles/` tokens/mixins or `*.module.scss`),
  SSG/build (`vite-react-ssg` entry / `vite.config.ts` / prerender), tooling /
  config, CI / Firebase deploy, dependencies.
- **Summary** — 1-3 sentences describing what the PR does and why.
- **Manual test plan** — concrete steps a reviewer can follow to verify.

### Step 4: Build PR title and description

**Title format:** `<type>(<scope>): <short description>` — Conventional Commits
style (the title is what `commitlint` conventions expect). Aim for ~70 chars;
stay under 100.

**Description:** Fill in the actual project template at
`.github/pull_request_template.md`. Read it fresh and complete every applicable
section — do not invent a simplified version. The template's sections are:

- **Summary** — what changed and why; add `Closes #123` if it resolves an issue.
- **Type of change** — tick all that apply.
- **Areas touched** — tick everything affected.
- **Accessibility (WCAG AA)** — if UI changed, confirm keyboard/focus,
  `prefers-reduced-motion`, semantics/alt text, and that `pnpm test` (jest-axe)
  passes. Tick "N/A" otherwise.
- **SSG / prerender** — if render output could change, confirm `pnpm build`
  prerenders real content into `dist/index.html` and there is no hydration
  mismatch (browser-only APIs stay inside effects / are guarded). Tick "N/A"
  otherwise.
- **Dependencies** — if `package.json` changed, confirm `pnpm-lock.yaml` is
  committed and `pnpm tool::check-engines` passes. Tick "N/A" otherwise.
- **Verification** — the CI-equivalent suite; see Step 5 for what to check
  programmatically.
- **Manual test plan** — reviewer-followable bullets.
- **Deployment notes** — Firebase `deploy:testbed` (hosting:testbed) vs
  `deploy:prod` (hosting:prod), or the GitHub Pages workflow on push to `main`.
- **Reviewer notes** — anything non-obvious.

Present the draft title and filled-in description to the user for approval before creating.

### Step 5: Check verifiable items before drafting the checklist

Tick the template's **Verification** boxes only for checks you actually run.
Where feasible, run them and report results:

- `pnpm lint:error` — no errors
- `pnpm format:check` — clean
- `pnpm stylelint` — clean (only if styles changed)
- `pnpm spellcheck` — clean
- `pnpm knip` — no new dead code / unused deps
- `pnpm secretlint` — no committed secrets
- `pnpm test` — all tests pass
- `pnpm build` — SSG build + prerender succeeds

Also grep the diff for leftover `console.log` / `debugger`. Leave boxes you
cannot verify (e.g. manual `pnpm preview` inspection) unchecked for the user.

### Step 6: Create the PR

Write the filled-in template body to a temp file and create the PR with `gh`:

```bash
gh pr create \
  --base main \
  --head "<current-branch>" \
  --title "<drafted title>" \
  --body-file <path-to-body-file>
```

- Add `--draft` if the user asked for a draft PR.
- Add `--reviewer <user>` for each reviewer the user names.
- `gh` infers `owner/repo` from the `origin` remote; pass `--repo sushant-kum/aboutme` only if the remote is ambiguous.

### Step 7: Report

After creation, display the PR title, number, and URL (`gh pr create` prints the URL — surface it).

## Rules

- **Always use the PR template** — read `.github/pull_request_template.md` and fill every applicable section; never skip sections.
- **Always show the draft** to the user before creating.
- **Never force-push** as part of PR creation.
- **Check the checklist items** that can be verified programmatically (run the `pnpm` checks; grep for `console.log` / `debugger`). Leave others unchecked for the user.
- If the PR resolves an issue, link it in the Summary with `Closes #<number>`.
- If the user asks for a draft PR, pass `--draft`.
