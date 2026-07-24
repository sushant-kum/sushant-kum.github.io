---
name: build-check
description: Run a TypeScript type-check and, if clean, a production (SSG) build for this repo — then report any errors.
disable-model-invocation: true
---

Type-check and optionally build this repo, then report the results.

This is a **single-package** Vite + React 19 project that ships a
**statically generated** page via `vite-react-ssg` (there is no React Router
and no route typegen step). TypeScript is configured via project references
(`tsconfig.json` → `tsconfig.app.json` + `tsconfig.node.json`), so the check
uses `tsc -b` (exposed as the `typecheck` script).

## Steps

1. **Type check only (fast)** — build the project references with no emit
   (both referenced tsconfigs set `noEmit`):

   ```bash
   pnpm run typecheck
   ```

   (`typecheck` is `tsc -b`.) It exits non-zero (code `2`) when it finds type
   errors.

2. **If errors were found, stop and report them.** Do not run the full build.

3. **If the type check is clean, run the full production build:**

   ```bash
   pnpm build
   ```

   (`tsc -b && vite-react-ssg build` — client + server bundles, then prerender
   of `dist/index.html`.) Report whether the build succeeded or failed, with the
   failing output if it failed.

## Output

Report:

- **Result**: pass / fail for each step run.
- **Error count**: number of type errors (and build errors, if the build ran).
- **First 20 error lines** if any errors were found.

Do **not** modify any files — this is a read-only check.
