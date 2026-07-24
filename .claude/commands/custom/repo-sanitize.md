---
name: repo-sanitize
description: Whole-repo sanitation & validation — runs format, lint, stylelint, knip, secretlint, spellcheck, a type-check, the test suite, and the production build one by one, showing each step's output.
disable-model-invocation: true
---

Run the following commands **one at a time, in order**, from the repo root. This
is a **single-package** Vite + React 19 site that ships a statically generated
page via `vite-react-ssg` — there is a single build and a single Vitest suite, so
the steps below cover the whole repo in one pass. After each command:

- Show me its output (stream it; for very long output show the tail and the final summary).
- State whether the step **passed** or **failed**.
- **Measure the runtime of each command.** Time it (e.g. wrap the call so its elapsed time is captured — `start=$SECONDS; <cmd>; echo "ELAPSED=$((SECONDS-start))s"` — or use `/usr/bin/time -p`). Record the elapsed time for the step.
- **If a step fails, STOP immediately.** Do not run the remaining steps. Report which step failed, the relevant error output, and a brief diagnosis. Do not auto-fix unless I ask.

Steps:

1. `pnpm run format:fix` — Prettier write
2. `pnpm run lint:fix` — ESLint with `--fix`
3. `pnpm run stylelint:fix` — Stylelint with `--fix`
4. `pnpm run knip` — dead-code / unused-deps / unused-exports check (read-only)
5. `pnpm run secretlint` — secret scan
6. `pnpm run spellcheck` — cspell spell check (read-only)
7. `pnpm run typecheck` — type check (`tsc -b` over the project references; `vite`/`vite-react-ssg build` does NOT run `tsc`, so this is the compile gate)
8. `pnpm test` — Vitest suite (includes the jest-axe accessibility checks)
9. `pnpm run build` — production build (`tsc -b && vite-react-ssg build` — client + server bundles, then prerender of `dist/index.html`)

Notes:

- Steps 1–3 modify files. After they run, mention if anything was changed.
- Step 7 exits non-zero (code `2`) on type errors — treat that as a failure and stop.
- These are long-running; do not background them — run in the foreground so I see live output.

## Final report (always produce this)

After the run ends — whether all steps passed or a step failed — print a final status table with **one row per step (all 9, always)**. Columns:

| #   | Command | Status | Runtime |
| --- | ------- | ------ | ------- |

- **Status** is `✅ passed`, `❌ failed`, or `⏭️ skipped` (for steps after the failed one).
- **Runtime** is the measured elapsed time (e.g. `12s`, `1m 34s`) for steps that actually ran. For **skipped** steps, leave Status as `⏭️ skipped` and **Runtime empty** (`—`). The failed step still shows its runtime.
- Below the table:
  - If all 9 passed, add the one-line summary: ✅ repo sanitation & validation passed — and the total wall-clock runtime.
  - If a step failed, name the failed step and give a brief diagnosis (per the stop-on-failure rule above).
