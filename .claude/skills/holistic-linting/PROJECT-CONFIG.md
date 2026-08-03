# Holistic Linting - Project Configuration

## Project: github-action-readme-generator

**Stack**: TypeScript + Node.js, ESM only. Don't hardcode version numbers here — read `package.json` (`engines`, `devDependencies`) for the current floor; this file has drifted from it twice already. `dist/cjs` is advertised in `package.json`'s `require` export but no build step actually produces it.
**Linter**: Biome 2.x (replaces ESLint + Prettier)
**Test Framework**: Vitest
**Build**: esbuild

## Linter Detection Override

This project uses **Biome** exclusively for linting and formatting TypeScript/JavaScript:

| Config File | Tools |
|------------|-------|
| `biome.json` | Biome (lint + format) |
| `.markdownlint.json` | markdownlint |
| `.husky/` | Husky git hooks |

## Running Formatters and Linters

### TypeScript/JavaScript Files (Biome)

```bash
# Format and lint with auto-fix (preferred - single command)
npx biome check --write ./src/ ./__tests__/

# Check only (CI mode)
npx biome check ./src/ ./__tests__/

# Format only
npx biome format --write ./src/

# Lint only
npx biome lint ./src/
```

### Markdown Files

```bash
npm run lint:markdown
npm run lint:markdown:fix
```

## Biome Rules

`biome.json` is the authoritative rule config — read it directly rather than trusting a rule list here; a hardcoded subset previously listed here was already missing several configured rules (`noBarrelFile`, `useNamingConvention`, `useFilenamingConvention`, `noReExportAll`, `noDelete`, among others) and had drifted from the real severities. Same for the `__tests__/**/*.ts` override block — read `biome.json`'s `overrides` section for the exact relaxed rules, don't re-derive it from memory.

If you need rule documentation Biome doesn't expose via CLI, check `https://biomejs.dev/linter/rules/{rule-name}`.

## Common Error Patterns and Fixes

**noExplicitAny → Use unknown**
```typescript
// Before
function validate(obj: any): obj is MyType

// After
function validate(obj: unknown): obj is MyType
```

**useExplicitType → Add type annotation**
```typescript
// Before
export const myVar = new MyClass();

// After
export const myVar: MyClass = new MyClass();
```

**useAwait → Add await or remove async**
```typescript
// Before (no await in function)
async function getData(): Promise<string> {
  return fetchData();  // Returns promise without await
}

// After (option 1: add await)
async function getData(): Promise<string> {
  return await fetchData();
}

// After (option 2: remove async if not needed)
function getData(): Promise<string> {
  return fetchData();
}
```

**noParameterAssign → Use local variable**
```typescript
// Before
function process(value: string) {
  value = value.trim();
  return value;
}

// After
function process(value: string) {
  const trimmed = value.trim();
  return trimmed;
}
```

Verify resolution with `npx biome check ./src/ ./__tests__/`.

## Integration with Git Hooks

Pre-commit runs: `lint-staged` (format/check staged files) → `npm run build` → `npm run generate-docs`.

**Known conflict, not yet resolved**: two different `lint-staged` configs exist simultaneously — `.lintstagedrc` (`prettier --write` on `.ts,.js,.json,.md`) and a different block in `package.json`'s `lint-staged` key (`biome check --write` on `.ts`, `prettier --write` on `.md,.yaml,.yml,.sh`, `biome format --write` on `.json`). Only one is actually read by `lint-staged` depending on its config-resolution order — don't assume the `package.json` block below is the one that runs without checking which file `lint-staged` actually picked up.

```json
{
  "*.{md,yaml,yml,sh}": "prettier --write",
  "{src,__tests__}/**/*.ts": "biome check --write",
  "*.json": "biome format --write"
}
```

## CI Validation

`test.yml` and `push_code_linting.yml` both pin `biomejs/setup-biome@v2` to `version: 2.5.1`, which does not match `package.json`'s `@biomejs/biome` devDependency (`2.5.3`). This is a real, known mismatch — deliberately left unreconciled, since Biome itself is being fully removed as part of the pending TypeScript 7 / Vite+ / Oxlint / Oxfmt conversion. Don't spend effort fixing version drift on a tool that's about to be deleted; this whole file gets replaced when that conversion lands.

## Common Issues and Solutions

**Issue**: "The parameter has an any type"
**Solution**: Change `any` to `unknown` and add type guards

**Issue**: "This variable name should be in camelCase"
**Solution**: For `__filename`/`__dirname` ESM polyfills, add biome-ignore:
```typescript
// biome-ignore lint/style/useNamingConvention: ESM polyfill
export const __filename: string = fileURLToPath(import.meta.url);
```

**Issue**: "This async function lacks an await expression"
**Solution**: Either add `await` to the return or remove `async` if not needed

**Issue**: Formatting conflicts
**Solution**: Run `npx biome check --write` to apply both format and lint fixes
