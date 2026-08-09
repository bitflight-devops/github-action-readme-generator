# AGENTS.md

Instructions for AI agents working in this repository.

## Project facts

- CLI + GitHub Action. Syncs README.md from action.yml (title, description, inputs, outputs, usage, badges).
- TypeScript, Node `>=24.19.0 <30.0.0` (`package.json` `engines`).
- Build: esbuild. Test: vitest. Lint/format: Biome + markdownlint.
- Not ESLint (migrated off); ignore stale "ESLint" mentions.
- Volta pins the dev version — check `.node-version`.

## Commit format

Conventional Commits — the `commit-msg` hook runs commitlint (see Pre-commit hooks).

## Build & validation commands

```bash
npm install              # first step after any checkout/pull
npm run build             # prebuild (tsc check) -> esbuild -> postbuild (declarations + MJS)
npm run test               # vitest, __tests__/**/*.test.ts
npm run coverage         # vitest --coverage -> ./out/
npm run format            # biome format --write ./src ./__tests__
npm run check              # biome check - CI's actual gate, no side effects
npm run lint:markdown  # markdownlint
npm run generate-docs  # regenerate README.md from action.yml
```

`npm run lint` is not a clean read-only check: npm's `prelint` hook (exact-name match,
so only `lint` gets it, not `lint:fix`) runs `biome format --write` + a full `tsc
--noEmit` check first, then `biome lint` + `markdownlint` run. `lint:fix` skips that
hook and runs `biome lint --write` + `markdownlint --fix` directly, not via `prelint`.
Both are narrower than CI's Biome coverage either way (no import-sorting). `npm run
check` matches CI's actual gate read-only; `check:fix` runs `biome check --write`.

## Pre-commit hooks (husky)

- **pre-commit**: `lint-staged && npm run build && npm run generate-docs`.
  - Gotcha: has silently dropped staged files despite exit 0.
  - Verify with `git show --stat HEAD` after committing.
- **commit-msg**: runs commitlint.
- **pre-push**: a no-op (commented out).

## dist/ files

- Gitignored, but a past release's snapshot may still be **tracked**.
- Check with `git ls-files dist/`.
- If tracked, a local rebuild shows as a *modification*, not an untracked file.
- If dist/ shows modified, `git restore dist/` — don't hand-commit it.
- Never `git add -f dist/` yourself — `deploy.yml` does that, releases only.

## Where to look

```text
src/
  index.ts                CLI entry point
  Action.ts                action.yml metadata parsing
  inputs.ts                 Inputs class: CLI args -> .ghadocs.json -> action.yml cascade
  readme-generator.ts   ReadmeGenerator class - generate()/updateSections()/outputSections()
  readme-editor.ts        reads/writes README.md's <!-- start X --> markers
  save.ts                    conditionally persists .ghadocs.json, not the README
  helpers.ts                utilities: git-tag version resolution, repo detection, table formatting
  prettier.ts                formatYaml/formatMarkdown/wrapDescription
  svg-editor.mts          SVGEditor class - branding SVG generation
  config.ts                  GHActionDocsConfig class - reads/saves .ghadocs.json
  constants.ts             Feather icon names + other constants
  util.ts                     shared TS type utilities (e.g. Nullable<T>)
  unicode-word-match.ts  ES5-compatible unicode word-match regex
  working-directory.ts   path resolution
  sections/                  one updater per README section, see index.ts
  markdowner/               markdown processing utilities
  logtask/                    LogTask logger, see bracket-padding pitfall
  errors/                     custom error types
__tests__/          vitest specs - loose match to src/, not 1:1 (see below)
__mocks__/          node:fs.ts - the only mock
scripts/               esbuild.mjs, release.sh, set_package_type.sh, latest_valid_node_version.sh
.github/workflows/  CI - file names differ from GitHub-displayed name: (see below)
docs/                    the TS7/Vite+ migration plan + its phase-0 findings
```

- `__tests__/` loosely follows `src/`'s file naming, not always nested.
- Example: `helpers.ts` → `helpers.test.ts`, but `src/markdowner/` → flat `markdowner.test.ts`.
- `src/errors/*` has no tests — search for a file's test, don't assume a path exists.

Root config files: see "Config files" table below.

## CI (`.github/workflows/`)

Display names differ from file names. Read the file directly for the exact
current step list.

- **`test.yml`** ("Tag and Release Updated NPM Package")
  - Triggers: `pull_request_target` + `push` (main/next/beta/\*.x) + `repository_dispatch`.
  - No plain `pull_request` trigger.
  - Runs `biome check` before tests. Node versions tested: see `matrix.node-version` in the file.
  - On `push` only, also invokes `deploy.yml`.
- **`push_code_linting.yml`** ("Code Linting Annotation")
  - `biome lint` runs *before* `npm install` here — opposite of `test.yml`.
  - Reviewdog posts inline PR annotations from it.
- **`deploy.yml`** ("NPM Release Workflow")
  - Not push-triggered directly: `workflow_call` (from `test.yml`) + `repository_dispatch`.
  - Runs `npm ci` → engine/signature checks → build → commit dist/ → `semantic-release`.

## Config files

| File | Purpose |
| --- | --- |
| `action.yml` | Action metadata — all inputs/outputs |
| `.ghadocs.json` | generate-docs config |
| `tsconfig.json` | TS compiler settings |
| `tsconfig.build.json` | `src/`-scoped declaration build, feeds `postbuild` |
| `tsconfig-mjs.json` | ESM build config |
| `biome.json` | Lint/format rules |
| `vitest.config.ts` | Test runner config |
| `package.json` | Deps, scripts, engines, volta |

## Pitfalls

1. "Cannot find module" → `npm install` first.
2. Tests fail after a change → `npm run build` first.
3. README.md changed after your commit → expected, pre-commit runs generate-docs.
4. `generate-docs` output brackets step types outside a log group (e.g. `[ERROR  ]`).
   - Padded to a shared width — grep the type, not a fixed-width string.
5. `generate-docs` picks the wrong version → `git fetch origin --tags` first.
   - A shallow/tagless checkout falls back to `package.json` instead of the latest tag.

## Key details

- README markers: `<!-- start inputs -->...<!-- end inputs -->`.
- Dual-purpose: GitHub Action (action.yml inputs) and CLI (`.ghadocs.json`/args).
- Versioning: latest git tag, falls back to `package.json` — must match pitfall 5.

## Tooling migration in progress

- Standing goal: Vite+ eventually drives format/lint/build/test/package/release.
- Plan: `docs/typescript-7-vite-plus-conversion-plan.md` (live, multi-phase).
- Done: TS7 alone. Not done: Oxlint/Oxfmt, Vite+ build.
- A task needing a piece of that system is a signal to advance the plan, not work around the gap.

## Working discipline

- `.claude/skills/checker-principle/SKILL.md`: verify before trusting any fix, bot finding, or your own diff.
  - Symlinked under `.agents/skills/` — auto-loads in any agent that reads that path (per agentskills.io).
- `.claude/skills/pr-review-workflow/SKILL.md`: handling PR review comments, judging draft-readiness.
- `.claude/skills/planning-multi-step-work/SKILL.md`: planning ahead, judging when a loop is warranted.
- Delegate large reads (logs, search results, big docs) to a fresh, cheap-model subagent — cheaper per call.
  - The checker-principle still applies to what it reports back.
- This file's TODOs (below) are shared cross-session state, not scratch notes.
  - Remove an entry once done; add one before ending a session with work left.

## TODOs

- None
