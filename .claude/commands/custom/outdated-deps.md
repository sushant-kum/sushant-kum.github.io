---
name: outdated-deps
description: Run `pnpm outdated` for this single-package repo and report a tabulated summary of outdated dependencies (dependencies + devDependencies).
disable-model-invocation: true
---

Audit outdated dependencies for this repo and present the results as a table.

This is a **single-package** project (not a pnpm monorepo): `pnpm-workspace.yaml`
declares only `allowBuilds`, there is no `packages:` field and no
`catalog:` section. So the audit is a single `pnpm outdated` at the repo root —
there are no workspace packages to traverse and no catalog to reconcile.

Optional argument `$ARGUMENTS`: a dependency name or glob pattern (e.g. `react`,
`@fontsource/*`, `eslint*`) to scope the audit to matching packages. If empty,
audit every dependency.

## Steps

1. **Run `pnpm outdated`** in the JSON form so the output is parseable:

   ```bash
   pnpm outdated --format json $ARGUMENTS || true
   ```

   **Include devDependencies — never skip them.** `pnpm outdated` reports
   `dependencies`, `devDependencies`, `optionalDependencies`, and
   `peerDependencies` by default; do not pass `--prod`, `--no-optional`, or any
   flag that would exclude a dependency class. Every outdated entry, regardless
   of its `dependencyType`, must appear in the findings.
   - **`pnpm outdated` exits with code `1` when it finds outdated dependencies.**
     This is NOT a failure — capture and parse stdout regardless of exit code
     (hence `|| true`). Only a different error (missing lockfile, network) is a
     real failure.
   - If `--format json` yields nothing useful, fall back to the default table
     form (`pnpm outdated $ARGUMENTS`).
   - Empty/`{}` output means everything is up to date — say so explicitly rather
     than reporting an empty table with no note.

   The JSON shape per dependency is roughly:
   `{ "<dep>": { "current", "wanted", "latest", "dependencyType", "isDeprecated" } }`.

## Output

Produce one table, one row per dependency. Columns:

| Dependency | Current | Wanted | Latest | Type | Semver jump |
| ---------- | ------- | ------ | ------ | ---- | ----------- |

- **Type**: `dep` / `devDep` / `peer` / `optional` (from `dependencyType`).
- **Semver jump**: `patch` / `minor` / `major` — comparing `current` → `latest`,
  so the reader can see which upgrades are breaking-risk at a glance.
- Append a `⚠ deprecated` note in the Dependency cell if `isDeprecated` is true.

Sort the table so `major` bumps come first (highest risk on top), then `minor`,
then `patch`.

## Summary

End with a short summary: total outdated deps, the split by type (dep vs devDep)
and by semver jump (how many majors / minors / patches), and any deprecated
packages that need attention. Note that catalog and workspace handling are N/A
for this repo. Do **not** modify any files — this is a read-only audit.
