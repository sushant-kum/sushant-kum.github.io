---
name: pnpm-audit
description: Run `pnpm audit` for this single-package repo, report known vulnerabilities with severity and remediation steps, and optionally apply fixes when invoked with `fix`.
argument-hint: '[fix] [severity]  e.g. (empty) | fix | fix critical'
disable-model-invocation: true
---

Audit this repo's dependency tree for **known security vulnerabilities** and
present a clear, actionable report. By default this is **read-only** — it
surfaces vulnerabilities and the steps to fix them but changes nothing.

This is a **single-package** project (not a pnpm monorepo): `pnpm-workspace.yaml`
declares only `allowBuilds` (build-script approvals) — there is no `packages:`
field, no `catalog:` section, and no release-cooldown policy. Direct-dependency
fixes therefore go in the root `package.json`, and transitive pins go in a
`pnpm.overrides` block in that same `package.json`.

Optional argument `$ARGUMENTS`:

- **empty** → read-only audit + remediation plan (default).
- **`fix`** → after reporting, also **apply fixes** (see "Fixing" below).
- **`fix <severity>`** (e.g. `fix critical`, `fix high`) → run the fix flow but
  only at or above that severity.
- anything else → treat as a clarification of scope and otherwise behave as the
  read-only audit.

## Steps

1. **Run the audit from the repo root.** `pnpm audit` operates on the whole
   lockfile (`pnpm-lock.yaml`); a single run at the root covers every dependency.
   Use the JSON form so the output is parseable:

   ```bash
   pnpm audit --json || true
   ```

   - **`pnpm audit` exits non-zero when it finds vulnerabilities.** This is NOT a
     failure — capture and parse stdout regardless of exit code (append
     `|| true`). Only a different error (network, registry auth) is a real
     failure; if the registry is unreachable, say so and stop.
   - If `--json` output is unwieldy, also capture the human table form for the
     summary view:

     ```bash
     pnpm audit || true
     ```

   The JSON shape is roughly:
   `{ "advisories": { "<id>": { "module_name", "severity", "vulnerable_versions", "patched_versions", "title", "url", "findings": [{ "paths": [...] }] } }, "metadata": { "vulnerabilities": { "info", "low", "moderate", "high", "critical" } } }`.

2. **Map each advisory to where it enters the tree.** For every advisory, use the
   dependency paths in `findings[].paths` to determine whether the vulnerable
   package is a **direct** dependency (listed in `package.json`) or a
   **transitive** one (pulled in by another dependency). Run `pnpm why` when the
   path is ambiguous:

   ```bash
   pnpm why <vulnerable-module>
   ```

   This determines the right fix location.

3. **Account for overrides.** There is no `pnpm.overrides` block yet — transitive
   pins are added by creating a `pnpm.overrides` entry in the root
   `package.json`. This repo does **not** enforce a release-cooldown
   (`minimumReleaseAge`) policy, so any version satisfying `patched_versions` can
   be installed directly — no `minimumReleaseAgeExclude` entry is needed.

## Output (read-only report)

### 1. Severity summary

A one-line count by severity from `metadata.vulnerabilities`:

> **critical: N · high: N · moderate: N · low: N · info: N**

If zero across the board, state "No known vulnerabilities" and stop.

### 2. Vulnerability table

One row per advisory, ordered **critical → high → moderate → low → info**:

| Severity | Package | Vulnerable | Patched | Path (direct/transitive) | Advisory |
| -------- | ------- | ---------- | ------- | ------------------------ | -------- |

- **Vulnerable**: `vulnerable_versions`.
- **Patched**: `patched_versions` (or `none available` if no patch exists yet).
- **Path**: `direct` or `transitive via <parent>`.
- **Advisory**: short `title` + the advisory `url`.

### 3. Remediation plan

For each distinct fix, a concrete, ordered step:

- **Direct dependency** → bump the version in the root `package.json`
  (`dependencies` or `devDependencies`), citing current → target range.
- **Transitive dependency** → add/adjust a `pnpm.overrides` entry in
  `package.json` pinning the vulnerable package to a `patched_versions`-satisfying
  range.
- **No patch available** → flag it explicitly; suggest mitigations (drop the
  dependency, pin away from the vulnerable path, or accept-and-track) and do not
  pretend it is fixable.

## Fixing (only when `$ARGUMENTS` starts with `fix`)

After producing the report above, apply the remediation:

1. **Prefer explicit, reviewable edits over a blind `pnpm audit --fix`.** Apply
   the `package.json` / `pnpm.overrides` changes from the remediation plan by
   editing the file directly, so the diff is intentional. `pnpm audit --fix`
   writes broad `pnpm.overrides` entries — use it only as a fallback for
   transitive-only fixes, and review the resulting diff.
2. If scope words were given (e.g. `fix critical`, `fix high`), only apply fixes
   at or above that severity and leave the rest in the report as TODO.
3. **Reinstall and re-audit** to confirm the fix landed and nothing broke:

   ```bash
   pnpm install
   pnpm audit || true
   ```

4. **Verify the app still type-checks and builds** after dependency bumps, using
   the same path as `/build-check`:

   ```bash
   pnpm run typecheck
   ```

   Run a full build if a major version moved:

   ```bash
   pnpm build
   ```

5. Report a before/after severity summary, list exactly which files changed and
   why, and call out any vulnerability that **could not** be auto-fixed (no patch,
   blocked by cooldown, or a required major-version bump that needs human review).
   Do **not** commit — leave the changes for the user to review.
