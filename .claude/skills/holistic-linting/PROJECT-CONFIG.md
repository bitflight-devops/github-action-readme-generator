# Holistic Linting - Project Configuration

## Project: github-action-readme-generator

**Stack**: TypeScript + Node.js, ESM only. Don't hardcode version numbers here — read `package.json` (`engines`, `devDependencies`) for the current floor; this file has drifted from it twice already. `dist/cjs` is advertised in `package.json`'s `require` export but no build step actually produces it.
**Linter**: Oxlint, type-aware (`lint.options: { typeAware: true, typeCheck: true }` in `vite.config.ts`), run via Vite+'s `vp` CLI — replaces Biome
**Test Framework**: Vitest
**Build**: esbuild

## Linter Detection Override

This project uses **Oxlint + Oxfmt, via Vite+ (`vp`)** exclusively for linting and formatting TypeScript/JavaScript:

| Config File | Tools |
|------------|-------|
| `vite.config.ts` | Oxlint (lint) + Oxfmt (format), via `vp` — `fmt`/`lint`/`check`/`staged` blocks |
| `.markdownlint.json` | markdownlint |
| `.husky/` | Husky git hooks |

## Running Formatters and Linters

### TypeScript/JavaScript Files (Oxlint + Oxfmt via Vite+)

```bash
# Format, lint, and type-check together with auto-fix (preferred - single command)
vp check --fix ./src/ ./__tests__/

# Check only (CI mode)
vp check ./src/ ./__tests__/

# Format only
vp fmt --write ./src/ ./__tests__/

# Lint only (type-aware)
vp lint --type-aware --type-check ./src/ ./__tests__/
```

### Markdown Files

```bash
npm run lint:markdown
npm run lint:markdown:fix
```

## Oxlint Rules

Oxlint's own default/recommended rule set is used as-is — this project has no hand-maintained rule config to keep in sync (unlike the old `biome.json`), and there is deliberately no 1:1 Biome→Oxlint rule mapping (see the migration plan's §8.3). The only lint-config surface this project customizes is `vite.config.ts`'s `lint` block (`options: { typeAware: true, typeCheck: true }`), which routes type checking through `tsgolint`.

For rule documentation, see `https://oxc.rs/docs/guide/usage/linter/rules.html` — ~847 rules across seven categories (correctness, suspicious, pedantic, perf, style, restriction, nursery), namespaced `plugin(rule-name)`.

One repo-specific override exists: `typescript/unbound-method` is disabled for `__tests__/**` — investigated site-by-site (26 sites, one vitest-mock idiom, zero exceptions), see that override's inline comment in `vite.config.ts`.

## Common Error Patterns and Fixes

These are actual type-aware findings confirmed by running `vp lint --format github --type-aware --type-check src` against this repo (see `docs/typescript-7-vite-plus-conversion-plan.md` §9 Phase 2) — not a hand-maintained rule list, and not a mapping of the old Biome-era patterns below.

**typescript(await-thenable) → don't await a value that isn't a Promise**
```typescript
// Before
async function getValue(): Promise<string> {
  return await plainString; // plainString isn't a Promise
}

// After
async function getValue(): Promise<string> {
  return plainString;
}
```

**typescript(no-base-to-string) → avoid relying on the default Object.prototype.toString()**
```typescript
// Before
function describe(value: SomeClass): string {
  return `Value: ${value}`; // implicit toString() may not be meaningful
}

// After
function describe(value: SomeClass): string {
  return `Value: ${value.toDisplayString()}`;
}
```

**typescript(restrict-template-expressions) → only interpolate string/number in template literals**
```typescript
// Before
const message = `Result: ${someObject}`; // non-primitive interpolated

// After
const message = `Result: ${JSON.stringify(someObject)}`;
```

For any other Oxlint finding, look it up individually at the rules reference above — don't assume a Biome-era rule name maps onto it.

Verify resolution with `vp lint --type-aware --type-check ./src/ ./__tests__/`.

## Integration with Git Hooks

Pre-commit runs: `vp staged` (format/lint staged files, per `vite.config.ts`'s `staged` block) → `npm run build` → `npm run generate-docs`.

`vite.config.ts`'s `staged` block is the single, authoritative config for pre-commit file processing — read it directly for the exact per-glob commands rather than trusting a copy here; there's no separate `.lintstagedrc` or `package.json` `lint-staged` block to reconcile against it.

## CI Validation

`test.yml` and `push_code_linting.yml` both bootstrap the `vp` CLI via `voidzero-dev/setup-vp`, pinned to an exact release tag (never the frozen `@v1` major tag, which the action's own README states stopped receiving updates at v1.15.0) — confirm the current tag via that action's [tags page](https://github.com/voidzero-dev/setup-vp/tags) rather than trusting a version number here. Keep the pin in sync across both workflows; a drift between them is the same class of problem the old `biomejs/setup-biome` version mismatch used to cause.

## Common Issues and Solutions

**Issue**: An Oxlint type-aware finding you don't recognize (e.g. `typescript(await-thenable)`, `typescript(no-base-to-string)`, `typescript(restrict-template-expressions)`)
**Solution**: Look it up at `https://oxc.rs/docs/guide/usage/linter/rules.html`, fix per the examples above — these come from `vite.config.ts`'s `lint.options.typeAware`/`typeCheck` routing through `tsgolint`, not from a Biome-style rule name.

**Issue**: "This async function lacks an await expression" / an unnecessary `await`
**Solution**: Either add `await` to the return or remove it, based on whether the callee actually returns a Promise

**Issue**: Formatting conflicts
**Solution**: Run `vp check --fix` to apply both format and lint fixes together

**Issue**: False positive linting error
**Solution**: Investigate via the rules reference above. If it's genuinely a false positive, silence just that line with `// oxlint-disable-next-line <rule-name>` (see `https://oxc.rs/docs/guide/usage/linter/ignore-comments.html`) and an explanatory comment — don't disable broadly.
