# GitHub Action Readme Generator - Coding Agent Instructions

## Project Overview

**Purpose**: CLI tool and GitHub Action that generates/updates README.md files from action.yml metadata. Automatically extracts title, description, inputs, outputs, and usage examples from action.yml and updates corresponding sections in README.md using markdown comment delimiters.

**Type**: TypeScript-based Node.js project
**Target Runtime**: Node.js 20.x (STRICT requirement - engines enforces >=20.0.0 <21.0.0)
**Package Manager**: npm >=10.0.0
**Build Tool**: esbuild + TypeScript compiler
**Test Framework**: vitest
**Code Style**: ESLint + Prettier + Markdownlint

## ⚠️ CRITICAL: Commit Message Format

**This repository uses Conventional Commits (enforced by commitlint + husky).**

**EVERY commit MUST follow this format:**

```
<type>: <description>

[optional body]

[optional footer]
```

**Common types:**

- `feat:` - New feature
- `fix:` - Bug fix or issue resolution (includes test fixes, integration tests)
- `docs:` - Documentation ONLY changes (README, comments ONLY if that's the sole change)
- `test:` - Test-only changes
- `refactor:` - Code restructuring without feature changes
- `chore:` - Build scripts, dependencies, tooling
- `ci:` - CI/CD changes

**Examples:**

- `fix: resolve path resolution error in npx usage` ✅
- `feat: add support for custom templates` ✅
- `docs: update installation instructions` ✅
- `Add new feature` ❌ (missing type)
- `docs: fix integration test` ❌ (wrong type - should be `fix:` or `test:`)

**Validation:** Run `git log --format=%B -n 1 | npx --no -- commitlint` to validate before pushing.

## Critical: Node Version Requirement

⚠️ **IMPORTANT**: This project REQUIRES Node 20.x. The engines field strictly enforces this. If you see `EBADENGINE` warnings during npm install, the environment is using an incompatible Node version. The project uses volta for version management - check `.node-version` (contains "20.9.0") and `package.json` volta field.

## Build & Validation Commands

### Installation & Build Sequence

**Always run commands in this exact order:**

1. **Install dependencies** (ALWAYS run first after any git checkout/pull):

   ```bash
   npm install
   ```

   - Expected: Completes in ~20-30s, installs ~1368 packages
   - Known warnings: May show peer dependency warnings for @types/node (safe to ignore)
   - If on Node 22+: Will show EBADENGINE warning (informational, but build still works)

2. **Build the project** (REQUIRED before testing changes):

   ```bash
   npm run build
   ```

   - Duration: ~5-10 seconds
   - Runs in sequence: prebuild (tsc type-check) → build (esbuild) → postbuild (generate declarations + MJS build)
   - Output: Creates `dist/` directory with:
     - `dist/bin/index.js` - CLI executable
     - `dist/mjs/` - ESM modules
     - `dist/cjs/` - CommonJS modules
     - `dist/types/` - TypeScript declarations
   - Clean build: `npm run clean` (removes dist/) before `npm run build`

### Testing

```bash
npm run test          # Run tests in watch mode (vitest)
npm run coverage      # Run tests with coverage report (outputs to ./out/)
```

- Duration: ~2 seconds
- All 111 tests should pass
- Test files: `__tests__/**/*.test.ts`
- Coverage reports: Generated in `./out/coverage-summary.json` and `./out/coverage-final.json`

### Linting & Formatting

```bash
# Run all linting (format + type-check + eslint + markdownlint)
npm run lint

# Auto-format code
npm run format          # Runs prettier on all files

# Fix linting issues
npm run lint:fix        # Runs format + eslint --fix + markdownlint --fix
npm run lint:markdown:fix   # Fix markdown linting only
```

**Pre-existing lint issues**: There are 4 linting errors in test files (`no-return-await` in action.test.ts, helpers.test.ts, inputs.test.ts, readme-generator.test.ts). These are pre-existing and may need fixing.

### Documentation Generation

```bash
npm run generate-docs
```

- Reads action.yml and updates README.md sections
- Generates branding SVG at `.github/ghadocs/branding.svg`
- Uses `.ghadocs.json` for configuration
- Duration: ~1-2 seconds

### Complete Validation Sequence

**To validate your changes will pass CI, run these in order:**

```bash
npm install              # Install/update dependencies
npm run build           # Build project
npm run test            # Run tests
npm run coverage        # Generate coverage
npm run format          # Format code
npm run lint:markdown   # Check markdown
npm run generate-docs   # Update README
```

Duration: Total ~40-60 seconds for full validation.

## Pre-commit Hooks

**Husky hooks are configured and WILL run automatically on commits:**

- **Pre-commit** (`.husky/pre-commit`): Runs `npm run pre-commit`
  - Executes: `lint-staged && npm run build && npm run generate-docs`
  - Duration: 30-60 seconds
  - This means EVERY commit triggers a full build and docs regeneration
  - Staged files are auto-formatted via prettier and eslint

- **Commit-msg** (`.husky/commit-msg`): Validates commit message format
  - Uses commitlint with conventional commits format
  - Example valid format: `feat: add new feature`, `fix: resolve bug`, `chore: update deps`

- **Pre-push** (`.husky/pre-push`): Additional validation before push

**Important**: If you make changes to action.yml, inputs.ts, or related files, the pre-commit hook will automatically update README.md. Include these updates in your commit.

## ⚠️ CRITICAL: Dist Files Workflow

**RULE: NEVER commit dist/ files manually. CI handles this automatically.**

### Decision Logic for AI Agents

```
IF git status shows dist/ files as modified:
  THEN ignore them - do NOT commit
  REASON: Pre-commit hook rebuilds dist/ for validation only

IF you are tempted to run `git add dist/`:
  THEN STOP - this is incorrect
  REASON: Only CI should commit dist/ files

IF pre-commit hook completes successfully:
  THEN commit ONLY your source changes (src/, package.json, etc.)
  AND leave dist/ changes uncommitted
```

### How Dist Files Work

1. **Developer commits source changes** (src/\*.ts, package.json, etc.)
2. **Pre-commit hook runs** → rebuilds dist/ for validation → you see dist/ modified in git status
3. **Developer commits** → do NOT include dist/ → ignore the modifications
4. **CI deploy workflow** (`.github/workflows/deploy.yml` lines 87-92):
   ```bash
   npm run build --if-present
   git add -f dist
   npm run generate-docs
   git commit -n -m 'build(release): bundle distribution files'
   npx semantic-release@latest
   ```
5. **CI commits dist/ files** with specific message `build(release): bundle distribution files`

### Why Dist Files Are Tracked But Ignored

- `dist/` IS in `.gitignore` (line 3: `/dist/`)
- BUT dist files ARE tracked in git (committed previously by CI)
- `.gitignore` prevents accidental manual commits
- CI uses `git add -f dist` to force-add during deploy

### What You Should Do

✅ **ALWAYS do:**

- Run `npm install` as the FIRST step (auto-runs `husky install` via prepare script)
- Commit source code changes (src/, package.json, tests, etc.)
- Let pre-commit hook rebuild dist/ (this validates your changes work)
- Push your commits normally

❌ **NEVER do:**

- `git add dist/` or `git add -f dist/`
- `git commit` with dist/ files included
- Bypass hooks with `HUSKY=0` unless investigating hook failures
- Worry about dist/ showing as modified in git status

## Project Structure

```
/
├── src/                          # TypeScript source files
│   ├── Action.ts                 # Main GitHub Action entry point
│   ├── index.ts                  # CLI entry point
│   ├── inputs.ts                 # Input parsing and configuration (19KB - key file)
│   ├── helpers.ts                # Utility functions (11KB)
│   ├── readme-generator.ts       # Core README generation logic
│   ├── readme-editor.ts          # README file manipulation
│   ├── sections/                 # Individual section generators
│   │   ├── update-inputs.ts      # Generates inputs table
│   │   ├── update-outputs.ts     # Generates outputs table
│   │   ├── update-usage.ts       # Generates usage examples
│   │   ├── update-title.ts       # Updates title section
│   │   └── ...                   # Other section updaters
│   ├── markdowner/               # Markdown processing utilities
│   ├── logtask/                  # Logging utilities
│   └── errors/                   # Custom error types
├── __tests__/                    # Vitest test files (mirrors src/ structure)
├── dist/                         # Build output (git-ignored, generated)
├── scripts/                      # Build and utility scripts
│   ├── esbuild.mjs              # esbuild configuration
│   └── set_package_type.sh      # Post-build script
├── .github/
│   ├── workflows/               # CI/CD workflows
│   │   ├── test.yml            # Main test workflow (runs on push/PR)
│   │   ├── push_code_linting.yml # Linting workflow
│   │   └── deploy.yml          # NPM release workflow
│   └── actions/setup-node/     # Composite action for Node setup
├── action.yml                   # GitHub Action metadata (KEY FILE)
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript config for ESM
├── tsconfig-mjs.json            # TypeScript config for MJS build
├── vitest.config.ts             # Vitest test configuration
├── .eslintrc.cjs                # ESLint configuration
├── .prettierrc.cjs              # Prettier configuration
├── .markdownlint.json           # Markdown linting rules
├── .ghadocs.json                # Tool configuration (used by generate-docs)
└── .husky/                      # Git hooks
```

## CI/CD Validation Pipeline

**Workflows run on every push/PR to main, next, beta:**

1. **Test Workflow** (`.github/workflows/test.yml`):
   - Runs on: push, pull_request_target
   - Steps: checkout → setup Node 20.x → npm install → npm test → npm run coverage → npm run build → npm run generate-docs
   - Must pass for PR merge

2. **Linting Workflow** (`.github/workflows/push_code_linting.yml`):
   - Runs: npm install → npm run lint:markdown → eslint via reviewdog
   - Reports inline PR comments via reviewdog

3. **Deploy Workflow** (`.github/workflows/deploy.yml`):
   - Only on push to main
   - Runs: build → generate-docs → semantic-release
   - Creates git commits and NPM releases

## Configuration Files Reference

| File                | Purpose                                             | When to Modify                                |
| ------------------- | --------------------------------------------------- | --------------------------------------------- |
| `action.yml`        | GitHub Action metadata - defines all inputs/outputs | When adding/changing action inputs or outputs |
| `.ghadocs.json`     | Tool configuration for README generation            | To customize README generation behavior       |
| `tsconfig.json`     | TypeScript compiler settings for CJS/types          | When changing TypeScript compilation targets  |
| `tsconfig-mjs.json` | TypeScript compiler settings for ESM                | For ESM-specific build configuration          |
| `.eslintrc.cjs`     | ESLint rules and plugins (strict config)            | When modifying linting rules                  |
| `.prettierrc.cjs`   | Code formatting rules                               | When changing code style                      |
| `vitest.config.ts`  | Test runner configuration                           | When modifying test setup                     |
| `package.json`      | Dependencies, scripts, engines, volta               | When adding deps or changing build scripts    |

## Common Pitfalls & Solutions

1. **Build fails with "Cannot find module"**: Run `npm install` first
2. **Tests fail after changes**: Run `npm run build` before testing
3. **Lint errors on test files**: Pre-existing `no-return-await` errors in 4 test files - can be ignored or fixed
4. **README.md changes after commit**: Expected - pre-commit hook runs `generate-docs`
5. **Pre-commit hook slow**: Normal - it runs full build + docs generation (~30-60s)
6. **EBADENGINE warning**: Using wrong Node version - requires Node 20.x

## Key Implementation Details

- **README markers**: Tool uses HTML comment delimiters like `<!-- start inputs --><!-- end inputs -->` to identify sections
- **Dual purpose**: Works as both GitHub Action (using action.yml inputs) and CLI tool (using .ghadocs.json or CLI args)
- **Branding**: Generates SVG icons from action.yml branding field using feather-icons
- **Versioning**: Auto-updates usage examples with latest version from package.json
- **Configuration cascade**: CLI args → .ghadocs.json → action.yml defaults

## Instructions for Coding Agents

**Trust these instructions.** Only search the codebase if information here is incomplete or incorrect.

**Before making changes:**

1. Ensure Node 20.x is active (check `node -v`)
2. Run `npm install` if package.json changed
3. Run `npm run build` after any source changes

**Before committing:**

1. Run full validation sequence (see "Complete Validation Sequence" above)
2. Review README.md changes if action.yml was modified
3. Ensure commit message follows conventional commits format

**When debugging:**

- Check dist/bin/index.js exists after build
- Verify **tests** directory mirrors src/ structure
- Look for `[ERROR]`, `[WARN]` in generate-docs output
