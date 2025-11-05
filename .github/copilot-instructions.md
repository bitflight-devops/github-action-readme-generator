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

## Build and Development Commands

### Critical Command Sequence

**Always follow this exact order when making changes:**

```bash
# 1. Install dependencies (ALWAYS run first, even if node_modules exists)
npm install

# 2. Run linting and formatting (catches issues early)
npm run format
npm run lint

# 3. Build the project
npm run build

# 4. Run tests
npm run test

# 5. Generate documentation (updates README.md)
npm run generate-docs
```

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

- `npm run test` - Run tests with Vitest (watches by default)
- `npm run coverage` - Generate coverage reports in `./out` directory
- Coverage threshold is tracked but not enforced

**Test Files Location:** `__tests__/` directory
**Coverage Output:** `./out/coverage-summary.json` and `./out/coverage-final.json`

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
- Markdown files must conform to `.markdownlint.json` rules

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

#### Build fails with "Cannot find module"

- **Solution:** Always run `npm install` before building, even if node_modules exists
- The project uses exact dependency versions (package-lock.json)

#### TypeScript errors during build

- **Solution:** Run `npm run prelint` to see type errors before building
- The project uses strict TypeScript rules (`@typescript-eslint`)

#### Linting fails unexpectedly

- **Solution:** Run `npm run format` first, then `npm run lint`
- Prettier and ESLint rules can conflict if formatting is skipped

#### Tests fail with module resolution errors

- **Solution:** The project uses NodeNext module resolution
- Ensure `.mts` extensions are used for pure ESM modules
- Check vitest.config.ts for module interop settings

#### dist/ files are stale

- **Solution:** The dist/ directory must be committed for GitHub Actions
- Always run `npm run build` before committing action changes
- The deploy workflow adds dist files with `git add -f dist`

#### README.md not updating

- **Solution:** Ensure markdown delimiters are present: `<!-- start section --><!-- end section -->`
- Run `npm run generate-docs` manually to test
- Check `.ghadocs.json` for configuration issues

#### Semantic release fails

- **Solution:** Ensure conventional commit messages are used
- The project uses @commitlint/config-conventional
- Commits must follow format: `type(scope): message`

## Key Implementation Details

**Markdown Delimiter System:**

- The tool uses comment tokens like `<!-- start title --><!-- end title -->` to identify sections
- Never remove these delimiters when editing README.md files
- Section names: title, description, badges, inputs, outputs, usage, contents, branding

**Configuration Precedence:**

1. Command-line arguments
2. `.ghadocs.json` file
3. Environment variables (for GitHub Actions)
4. Defaults from `action.yml`

**Module System:**

- The project exports both ESM (`dist/mjs/`) and CJS (`dist/cjs/`)
- `package.json` has `"type": "module"`
- Use `.mts` extension for pure ESM files (e.g., `svg-editor.mts`)
- Scripts use `.mjs` extension

**Dependencies:**

- `@actions/core` and `@actions/github` for GitHub Action integration
- `yaml` for parsing action.yml
- `nconf` for configuration management
- `prettier` for markdown formatting
- `chalk` for colored console output
- `@svgdotjs/svg.js` for SVG branding generation

## Trust These Instructions

When working on this repository, **trust these instructions** and avoid unnecessary exploration. Only search for additional information if:

- These instructions are incomplete for your specific task
- You encounter errors not documented here
- You need to understand implementation details of specific functions

The build, test, and validation commands documented here have been verified and will work correctly when run in the specified order.
