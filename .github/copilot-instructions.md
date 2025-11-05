# Copilot Instructions for github-action-readme-generator

## Repository Overview

This is a **GitHub Action and CLI tool** written in **TypeScript** that generates and maintains README.md files for GitHub Actions by reading metadata from `action.yml` files. The tool automatically updates sections like inputs, outputs, usage examples, and branding using markdown comment delimiters (`<!-- start section --><!-- end section -->`).

**Key Facts:**

- **Language**: TypeScript (Node 20.x required)
- **Size**: ~426KB, medium-sized project
- **Target Runtime**: Node.js 20.0.0 - <21.0.0
- **Package Manager**: npm >=10.0.0
- **Build Tool**: esbuild for bundling
- **Test Framework**: Vitest
- **Module Type**: Dual ESM/CJS (exports both formats)

**CRITICAL: This repository requires a clean `npm install` in EVERY new session/container.** The node_modules directory is not persisted between sessions, and TypeScript type definitions will be missing without it, causing build failures with errors like "Cannot find type definition file for 'node'".

## Quick Start (First Time Setup)

**If this is your first time working on this repository or you're in a fresh environment:**

```bash
# 1. Navigate to repository root (if not already there)
cd /home/runner/work/github-action-readme-generator/github-action-readme-generator

# 2. Install dependencies (CRITICAL - will fail without this)
npm install

# 3. Verify installation
ls node_modules/@types/node  # Should exist and not error
ls node_modules/@tsconfig/node20  # Should exist and not error

# 4. Build the project
npm run build

# 5. Run tests to verify everything works
npm run test -- --run

# You should see 111 tests pass and 1 test fail (integration-issue-335.test.ts - this is expected)
```

**Expected output from successful setup:**

- npm install: ~1159 packages installed with peer dependency warnings (safe to ignore)
- npm run build: dist/ directory created with bin/, mjs/, cjs/, and types/ subdirectories
- npm run test: 111 passing, 1 failing (integration-issue-335.test.ts - expected failure)

## Build and Development Commands

### Critical Command Sequence

**Always follow this exact order when making changes:**

```bash
# 1. Install dependencies (ALWAYS run first, even if node_modules exists)
# This is CRITICAL - without this, TypeScript will fail with "Cannot find type definition" errors
npm install

# 2. Run linting and formatting (catches issues early)
npm run format
npm run lint

# 3. Build the project
npm run build

# 4. Run tests
npm run test -- --run  # Use --run flag to avoid watch mode in CI/automation

# 5. Generate documentation (updates README.md)
npm run generate-docs
```

**⚠️ IMPORTANT FIRST-TIME SETUP:**

If you're working in a fresh clone or new environment:

1. **Dependencies must be installed first**: Without `npm install`, you'll get TypeScript errors about missing type definitions (`@types/node`, `@tsconfig/node20`, etc.)
2. **Expected warnings during install**: You'll see peer dependency warnings about `@types/node` version conflicts between the project (20.8.10) and vitest's vite (24.10.0). These are safe to ignore.
3. **Verify installation**: After `npm install`, check that `node_modules/@types/node` and `node_modules/@tsconfig/node20` exist

### Build Process Details

**TypeScript Compilation + Bundling:**

- `npm run build` performs the following in sequence:
  1. Pre-build: TypeScript type checking (`tsc --noemit`)
  2. Clean and bundle with esbuild (`scripts/esbuild.mjs`)
  3. Post-build: Generate type declarations and set package types
  4. Makes `dist/bin/index.js` executable
  5. Creates dual ESM/CJS outputs in `dist/mjs/` and `dist/cjs/`

**Important:** The build process requires the `scripts/set_package_type.sh` script to run successfully to set proper module types in dist subdirectories.

### Testing

**Test Commands:**

- `npm run test` - Run tests with Vitest (watches by default in interactive mode)
- `npm run test -- --run` - Run tests once without watch mode (recommended for CI/automation)
- `npm run coverage` - Generate coverage reports in `./out` directory
- Coverage threshold is tracked but not enforced

**Test Files Location:** `__tests__/` directory
**Coverage Output:** `./out/coverage-summary.json` and `./out/coverage-final.json`

**Known Test Failures:**

- `__tests__/integration-issue-335.test.ts` - This test is **expected to fail** as it validates a known issue where the tool fails when executed via npx/yarn dlx from a directory without access to the package's action.yml file (which isn't included in published npm package)
- **ESLint warnings in test files** - There are 4 existing ESLint errors in test files about `sonarjs/prefer-immediate-return`. These are pre-existing and not blockers for development

### Linting and Formatting

**Linting Commands (run in this order):**

```bash
npm run format          # Prettier formatting (ALWAYS run first)
npm run prelint         # TypeScript type checking
npm run lint            # ESLint + Markdown linting
npm run lint:fix        # Auto-fix ESLint errors
npm run lint:markdown:fix  # Auto-fix Markdown errors
```

**Linters in Use:**

- **ESLint** (`.eslintrc.cjs`) - TypeScript/JavaScript linting
- **Prettier** (`.prettierrc.cjs`) - Code formatting
- **markdownlint** (`.markdownlint.json`) - Markdown linting
- **shellcheck** (`.shellcheckrc`) - Shell script linting
- **cspell** (`.cspell.json`) - Spell checking

**Common Issues:**

- Always run `npm run format` before `npm run lint` to avoid formatting conflicts
- TypeScript must pass type checking (`prelint`) before ESLint runs
- Markdown files must conform to `.markdownlint.json` rules (see "Common Pitfalls" section for details)
- **Pre-existing ESLint errors**: The codebase has 4 pre-existing ESLint errors in test files (`sonarjs/prefer-immediate-return`). These are not related to your changes and can be ignored unless you're specifically fixing them

### Docker-based Development

**Using Make commands (recommended for consistency):**

```bash
make setup      # Build Docker image and install dependencies
make lint       # Run all linters in Docker
make lint-fix   # Fix lint errors in Docker
make test       # Run tests in Docker
make npm        # Run arbitrary npm commands in Docker
```

Docker image: `node:20-alpine` (defined in `Makefile`)

### Environment Setup

**Node Version Management:**

- The project uses Node 20.x (specified in `.node-version` and `package.json` engines)
- Volta is configured (`"volta": { "node": "20.9.0" }` in package.json)
- GitHub workflows use `.github/actions/setup-node` composite action for setup

**Required Tools:**

- Node.js 20.0.0 - <21.0.0 (strict requirement)
- npm >=10.0.0
- Optional: Docker for isolated builds
- Optional: Volta for version management

## Project Architecture and Layout

### Source Code Structure

```text
src/
├── Action.ts              # Main action class, entry point for GitHub Action
├── index.ts               # CLI entry point
├── config.ts              # Configuration management (reads .ghadocs.json)
├── constants.ts           # Global constants and types
├── inputs.ts              # Input parsing and validation (19KB, complex)
├── helpers.ts             # Utility functions (11KB)
├── readme-generator.ts    # Core README generation logic
├── readme-editor.ts       # Markdown manipulation
├── prettier.ts            # Prettier integration
├── svg-editor.mts         # SVG branding icon generation
├── save.ts                # Save configuration to .ghadocs.json
├── working-directory.ts   # Working directory utilities
├── logtask/               # Logging utilities with colors/emojis
│   └── index.ts
├── markdowner/            # Markdown parsing and generation
├── sections/              # Section generators (title, inputs, outputs, etc.)
└── errors/                # Custom error classes
```

### Key Files and Configuration

**Root Configuration Files:**

- `action.yml` - GitHub Action metadata (defines inputs/outputs)
- `package.json` - Node package configuration, scripts, dependencies
- `tsconfig.json` - TypeScript configuration (NodeNext modules)
- `tsconfig-mjs.json` - ESM-specific TypeScript config
- `.eslintrc.cjs` - ESLint rules (strict TypeScript rules)
- `.prettierrc.cjs` - Prettier configuration
- `.markdownlint.json` - Markdown linting rules
- `.ghadocs.json` - Runtime configuration for the tool itself
- `vitest.config.ts` - Vitest test configuration
- `.node-version` - Node version constraint (20.x)
- `Makefile` - Docker-based development commands
- `Dockerfile` - Containerized build environment

**Build Output:**

- `dist/bin/index.js` - CLI executable (bundled)
- `dist/mjs/` - ES Module output
- `dist/cjs/` - CommonJS output
- `dist/types/index.d.ts` - TypeScript declarations

**Scripts Directory:**

- `scripts/esbuild.mjs` - esbuild bundling configuration
- `scripts/set_package_type.sh` - Sets package.json type in dist folders
- `scripts/latest_valid_node_version.sh` - Validates Node version compatibility
- `scripts/formatter.ts` - Prettier utilities
- `scripts/editorconfig.ts` - EditorConfig utilities

### GitHub Workflows

**CI/CD Pipeline (.github/workflows/):**

1. **test.yml** - Main CI workflow (runs on push/PR)

   - Installs Node 20.x via `.github/actions/setup-node`
   - Runs: `npm install` → `npm test` → `npm run coverage` → `npm run build` → `npm run generate-docs`
   - Reports coverage using vitest-coverage-report-action
   - Calls deploy.yml on main branch pushes

2. **push_code_linting.yml** - Linting workflow

   - Runs on PR/push
   - Executes: `npm install` → `npm run lint:markdown` → ESLint via reviewdog
   - Uses markdownlint-problem-matcher for annotations

3. **deploy.yml** - NPM Release (semantic-release)
   - Triggered by test.yml or repository_dispatch
   - Runs: `npm ci` → `npm run build` → `npm run generate-docs` → `npx semantic-release`
   - Requires: `RELEASE_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN` secrets
   - Commits dist files before release

**Pre-commit Hooks:**

- Husky configured (`.husky/` directory)
- lint-staged runs on commit (`.lintstagedrc`)
- Runs: prettier, eslint --fix on staged files

### Validation Pipeline

**Before submitting a PR, ensure all these pass:**

1. **Formatting:** `npm run format` (Prettier)
2. **Type Checking:** `npm run prelint` (TypeScript --noemit)
3. **Linting:** `npm run lint` (ESLint + markdownlint)
4. **Tests:** `npm run test` (Vitest)
5. **Build:** `npm run build` (esbuild + TypeScript declarations)
6. **Documentation:** `npm run generate-docs` (Update README.md)

**GitHub Actions will run:**

- Unit tests with coverage reporting
- ESLint with reviewdog annotations
- Markdown linting with problem matchers
- Build verification
- Documentation generation check

### Common Pitfalls and Workarounds

#### ERROR: "Cannot find type definition file for 'node'" during build

**Symptom:**

```text
error TS2688: Cannot find type definition file for 'node'.
error TS2688: Cannot find type definition file for 'vitest/globals'.
tsconfig.json(2,14): error TS6053: File '@tsconfig/node20/tsconfig.json' not found.
```

**Root Cause:** node_modules is missing or incomplete (no `@types/node`, `@tsconfig/node20`, or `vitest` type definitions installed)

**Solution:**

```bash
# ALWAYS run npm install first in any new session/container
npm install

# Verify installation succeeded
ls node_modules/@types/node  # Should exist
ls node_modules/@tsconfig/node20  # Should exist
```

**Why this happens:** The repository doesn't commit node_modules (correctly), and if you start work without installing dependencies, TypeScript can't find type definitions. This is especially common in new containers, fresh clones, or after cleaning the workspace.

#### Build fails with "Cannot find module"

- **Solution:** Always run `npm install` before building, even if node_modules exists
- The project uses exact dependency versions (package-lock.json)
- If you see module resolution errors, try deleting node_modules and running `npm install` again

#### TypeScript errors during build

- **Solution:** Run `npm run prelint` to see type errors before building
- The project uses strict TypeScript rules (`@typescript-eslint`)
- Common issue: Missing type imports or incorrect module resolution paths

#### Linting fails unexpectedly

- **Solution:** Run `npm run format` first, then `npm run lint`
- Prettier and ESLint rules can conflict if formatting is skipped
- **Known issue**: 4 pre-existing ESLint errors in test files about `sonarjs/prefer-immediate-return` - these can be ignored

#### Markdown linting errors (MD036, MD040)

**Common markdown lint errors:**

1. **MD040** - "Fenced code blocks should have a language specified"

   - Always specify a language for code blocks: bash, text, typescript, json, etc.
   - Use `text` for plain output or generic text

2. **MD036** - "Emphasis used instead of a heading"

   ```markdown
   <!-- ❌ Wrong -->

   **Issue: Some problem**

   <!-- ✅ Correct -->

   #### Some problem
   ```

**Solution:** Run `npm run format` to auto-fix most markdown issues, or `npm run lint:markdown:fix` for markdown-specific fixes

#### Tests fail with module resolution errors

- **Solution:** The project uses NodeNext module resolution
- Ensure `.mts` extensions are used for pure ESM modules
- Check vitest.config.ts for module interop settings
- **Expected failure**: `__tests__/integration-issue-335.test.ts` is supposed to fail (validates known issue #335)

#### One test consistently fails: integration-issue-335.test.ts

**This is EXPECTED behavior!** The failing test (`should fail when executed from a directory other than the project root`) validates issue #335 where the tool fails when run via npx/yarn dlx because action.yml isn't included in the published npm package. The test intentionally moves action.yml to simulate this failure scenario.

**Do not try to fix this test** - it's a known issue test that documents expected failure behavior.

#### dist/ files are stale

- **Solution:** The dist/ directory must be committed for GitHub Actions
- Always run `npm run build` before committing action changes
- The deploy workflow adds dist files with `git add -f dist`
- If dist/ is out of sync, the GitHub Action won't work correctly when published

#### README.md not updating

- **Solution:** Ensure markdown delimiters are present: `<!-- start section --><!-- end section -->`
- Run `npm run generate-docs` manually to test
- Check `.ghadocs.json` for configuration issues
- The tool uses these delimiters to know where to inject generated content without overwriting custom sections

#### Semantic release fails

- **Solution:** Ensure conventional commit messages are used
- The project uses @commitlint/config-conventional
- Commits must follow format: `type(scope): message`
- Valid types: feat, fix, docs, style, refactor, test, chore

#### Peer dependency warnings during npm install

**You will see warnings like:**

```text
npm warn ERESOLVE overriding peer dependency
npm warn Could not resolve dependency:
npm warn peerOptional @types/node@"^20.19.0 || >=22.12.0" from vite@7.1.12
```

**This is NORMAL and safe to ignore.** The project uses `@types/node@20.8.10` while vitest's vite prefers a newer version. The project's version is pinned for compatibility with Node 20.x runtime.

## Key Implementation Details

**Markdown Delimiter System:**

- The tool uses comment tokens like `<!-- start title --><!-- end title -->` to identify sections
- Never remove these delimiters when editing README.md files
- Section names: title, description, badges, inputs, outputs, usage, contents, branding
- **How it works:** The tool parses README.md for these delimiters, extracts content from action.yml, and injects/updates the content between the delimiters while preserving everything else

**Configuration Precedence:**

1. Command-line arguments (highest priority)
2. `.ghadocs.json` file in repository root
3. Environment variables (for GitHub Actions)
4. Defaults from `action.yml` (lowest priority)

**Module System:**

- The project exports both ESM (`dist/mjs/`) and CJS (`dist/cjs/`)
- `package.json` has `"type": "module"` - the project uses ES modules by default
- Use `.mts` extension for pure ESM files (e.g., `svg-editor.mts`)
- Scripts use `.mjs` extension
- The build process creates both module formats for maximum compatibility
- TypeScript is configured with `"module": "NodeNext"` for modern module resolution

**Dependencies:**

- `@actions/core` and `@actions/github` for GitHub Action integration
- `yaml` for parsing action.yml
- `nconf` for configuration management (hierarchical configuration with precedence)
- `prettier` for markdown formatting (ensures consistent output)
- `chalk` for colored console output (terminal colors)
- `@svgdotjs/svg.js` for SVG branding generation (creates branding badges)

**Known Issues:**

- **Issue #335**: The tool fails when executed via `npx` or `yarn dlx` from a different directory because `action.yml` is not included in the published npm package (it's not in the "files" array in package.json). There's a failing integration test that documents this expected behavior.

## Testing Your Changes

### Running the CLI Tool

After building, you can test the tool locally:

```bash
npm run build
node dist/bin/index.js --help  # Show help
node dist/bin/index.js         # Run on current repo (will update this README)
```

### Debugging

The tool supports debug flags:

```bash
node dist/bin/index.js --debug:config  # Show resolved configuration
node dist/bin/index.js --debug:nconf   # Show nconf object with all values
```

### Manual Testing Checklist

When making changes, test these scenarios:

1. **Fresh install**: Delete node_modules, run `npm install`, verify build works
2. **Lint and format**: Run `npm run format && npm run lint`, verify no errors (except known 4 ESLint errors in tests)
3. **Build**: Run `npm run build`, verify dist/ directory is created with bin/, mjs/, cjs/, and types/ subdirectories
4. **Tests**: Run `npm run test -- --run`, verify only integration-issue-335 fails (expected)
5. **Documentation**: Run `npm run generate-docs`, verify README.md updates correctly

## Troubleshooting Guide

### "Command not found" errors

If you get command not found errors for npm scripts:

```bash
# Make sure you're in the repository root
cd /home/runner/work/github-action-readme-generator/github-action-readme-generator

# Verify package.json exists
ls package.json

# Install dependencies if missing
npm install
```

### Build succeeds but tool doesn't run

```bash
# Verify dist/bin/index.js exists and is executable
ls -la dist/bin/index.js

# Make it executable if needed (postbuild should do this)
chmod +x dist/bin/index.js

# Try running with node directly
node dist/bin/index.js --help
```

### "Cannot read properties of undefined" errors

This usually means the tool is trying to access properties that don't exist in the action.yml or configuration. Check:

1. Is there a valid action.yml in the current directory?
2. Does the action.yml have the expected structure (name, description, runs, etc.)?
3. Run with `--debug:config` to see what configuration is being loaded

### Changes not reflected in README

1. Verify markdown delimiters exist in README.md: `<!-- start section --><!-- end section -->`
2. Run `npm run generate-docs` to regenerate
3. Check `.ghadocs.json` for any overrides that might be preventing updates
4. Verify the build is up to date: `npm run build` before `npm run generate-docs`

## Trust These Instructions

When working on this repository, **trust these instructions** and avoid unnecessary exploration. Only search for additional information if:

- These instructions are incomplete for your specific task
- You encounter errors not documented here
- You need to understand implementation details of specific functions

**These instructions were created by:**

1. Running a fresh `npm install` and documenting all warnings/errors encountered
2. Executing the full build pipeline and noting each step's requirements
3. Running tests and documenting expected failures (issue #335)
4. Running linters and documenting pre-existing issues
5. Testing the CLI tool to understand its behavior
6. Reviewing the codebase structure, workflows, and configuration files

The build, test, and validation commands documented here have been verified and will work correctly when run in the specified order **in a fresh environment with `npm install` run first**.
