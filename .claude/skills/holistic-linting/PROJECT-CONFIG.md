# Holistic Linting - Project Configuration

## Project: github-action-readme-generator

**Stack**: TypeScript 5.7.3, Node.js 20.x, ESM with dual CJS/ESM output
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

## Biome Rule Categories

The project enforces strict linting with these rule categories:

### Error Level (Blocks CI)
- `correctness/*` - Catch bugs (unused imports, variables)
- `security/*` - Prevent XSS, injection
- `nursery/useExplicitType` - Require explicit types on exports
- `suspicious/useAwait` - Async functions must use await
- `suspicious/noEvolvingTypes` - Variables must have stable types

### Warning Level (Should Fix)
- `complexity/noForEach` - Prefer for...of loops
- `complexity/useLiteralKeys` - Prefer obj.key over obj['key']
- `style/noParameterAssign` - Don't reassign parameters
- `style/useNodejsImportProtocol` - Use node: prefix
- `suspicious/noConsole` - Avoid console in production
- `suspicious/noExplicitAny` - Use unknown instead

### Test File Overrides (__tests__/**/*.ts)
Relaxed rules for test files:
- `useAwait`: off (vi.mock uses async callbacks)
- `useNamingConvention`: off (__filename/__dirname polyfills)
- `noMisplacedAssertion`: off (assertions in mock callbacks)
- `noConsole`: off (debug logging in tests)
- `useExplicitType`: off (inference in tests is fine)

## Biome Resolution Workflow

When Biome reports an error:

### 1. Research the Rule
```bash
# Biome doesn't have built-in rule docs CLI, check online:
# https://biomejs.dev/linter/rules/{rule-name}
```

### 2. Common Error Patterns and Fixes

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

### 3. Verify Resolution
```bash
npx biome check ./src/ ./__tests__/
```

## Integration with Git Hooks

Pre-commit runs:
1. `lint-staged` - Formats and checks staged files
2. `npm run build` - Ensures build succeeds
3. `npm run generate-docs` - Updates README from action.yml

lint-staged config (from package.json):
```json
{
  "*.{md,yaml,yml,sh}": "prettier --write",
  "{src,__tests__}/**/*.ts": "biome check --write",
  "*.json": "biome format --write"
}
```

## CI Validation

The test workflow runs:
```yaml
- name: Setup Biome
  uses: biomejs/setup-biome@v2
  with:
    version: latest

- name: Biome check
  run: biome check ./src/ ./__tests__/
```

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
