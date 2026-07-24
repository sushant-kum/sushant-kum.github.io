---
name: jsdoc-generation
description: Generate JSDoc comments for TypeScript/JavaScript code following this project's ESLint jsdoc rules
---

# JSDoc Generation

Add JSDoc comments to the specified files or code. Follow the project's ESLint jsdoc plugin configuration exactly.

**User input:** $ARGUMENTS

## ESLint JSDoc Configuration

This project uses `eslint-plugin-jsdoc` (v63) but **does NOT enable the
`flat/recommended` preset**. The config in `eslint.config.js` lists these rules
explicitly, all at `warn`:

| Rule                              | Setting  | Meaning                                                        |
| --------------------------------- | -------- | -------------------------------------------------------------- |
| `jsdoc/check-alignment`           | `'warn'` | The leading `*` gutter must be aligned                         |
| `jsdoc/check-indentation`         | `'warn'` | No unexpected extra indentation inside the JSDoc block         |
| `jsdoc/check-param-names`         | `'warn'` | `@param` names must match the actual parameter names, in order |
| `jsdoc/check-types`               | `'warn'` | Any type written in braces must be a valid/consistent type     |
| `jsdoc/require-description`       | `'off'`  | A description is NOT required                                  |
| `jsdoc/require-param`             | `'off'`  | `@param` tags are NOT required                                 |
| `jsdoc/require-param-description` | `'off'`  | Param descriptions are NOT required                            |
| `jsdoc/require-returns`           | `'off'`  | `@returns` is NOT required                                     |

**What this means in practice:**

- **JSDoc is entirely optional here.** Nothing is required — the plugin only
  _validates_ JSDoc that you choose to write. So add JSDoc where it adds real
  meaning; don't paper every symbol with boilerplate.
- **Column-aligned tags are NOT enforced.** Unlike some projects, there is no
  `check-line-alignment` rule — do not add extra spaces to line up `@param`
  descriptions. `check-alignment` only requires the `*` gutter to line up
  (standard JSDoc formatting), and `check-indentation` forbids stray indentation.
- **This is TypeScript** — do NOT add `@param {type}` / `@returns {type}`
  annotations; TS owns the types. If you _do_ write a type in braces, `check-types`
  will validate it, so it must be correct. Prefer describing, not typing.
- **`@param` names must match** the real parameters exactly (`check-param-names`).
- All jsdoc rules are **warnings**, not errors — they won't fail `pnpm lint:error`
  (which is `--quiet`, errors only), but keep them clean anyway. `prettier/prettier`
  IS an error, so the comment must be Prettier-clean.

## Templates

Descriptions are optional but recommended for non-obvious exports. Use simple
single-space separators (no column alignment).

### Function / Method

```typescript
/**
 * Formats an experience role's date range for the timeline.
 * @param start - ISO month the role began.
 * @param end - ISO month the role ended, or `null` if it is current.
 * @returns A human-readable period label.
 */
```

### React Component (arrow function)

```typescript
/**
 * Renders a section heading with an optional monospace eyebrow label.
 * @param props - The component props.
 * @param props.id - The heading `id`, used as the section's scroll anchor.
 * @param props.title - The visible heading text.
 * @param props.eyebrow - Optional kicker rendered above the title.
 * @returns The rendered section header.
 */
```

### Custom Hook

```typescript
/**
 * Tracks whether the given media query currently matches.
 * @param query - A CSS media query string.
 * @returns True when the query matches the current viewport.
 */
```

### Interface / Type

```typescript
/**
 * A featured project rendered as a showcase card (no external link).
 */
export interface Project {
  title: string;
  blurb: string;
  tech: string[];
}
```

Do **not** add JSDoc to individual interface/type properties unless a property is
genuinely non-obvious.

### Constants / Enums

```typescript
/**
 * Social profile links rendered in the contact footer.
 */
export const SOCIALS = {
  /** Public GitHub profile. */
  github: 'https://github.com/sushant-kum',
} as const;
```

## Rules

1. Only add JSDoc where it adds meaning — nothing is required, so skip self-evident symbols.
2. Keep the `*` gutter aligned and avoid stray indentation (`check-alignment`, `check-indentation`).
3. Do NOT column-align `@param` descriptions — that is not enforced here; single space after the hyphen.
4. Use `@param name - Description` (hyphen separator); do NOT add `{type}` in TS code.
5. `@param` names must exactly match the function's parameters, in order (`check-param-names`).
6. Only use `@throws {ErrorType}` when the function actually throws; the type in braces must be valid (`check-types`).
7. Prefer complete sentences and present tense ("Returns the user", not "Return the user"), though this is style, not an enforced rule.

## Workflow

1. Read the target file(s).
2. Identify exported functions, components, hooks, interfaces, types, and constants worth documenting.
3. Add JSDoc following the templates and rules above.
4. Run `pnpm lint:fix` after editing to auto-fix and surface any jsdoc warnings.
5. Resolve remaining jsdoc warnings before moving to the next file.

When processing multiple files, work one file at a time. Skip generated files and build output (e.g. `dist/`); this repo has no vendored/third-party component directory to skip.
