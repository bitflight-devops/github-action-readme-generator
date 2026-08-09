# AGENTS.md

Instructions for AI agents working in this repository.

## Project facts

- CLI + GitHub Action. Syncs README.md from action.yml (title, description, inputs, outputs, usage, badges).
- TypeScript, Node `>=24.19.0 <30.0.0` (`package.json` `engines`).
- Build: `vp pack` (tsdown, via Vite+). Test: `vp test` (Vitest, via Vite+). Lint/format: Oxlint + Oxfmt via Vite+'s `vp` CLI, plus markdownlint.
- Volta pins the dev version — check `.node-version`.

## Commit format

Conventional Commits — the `commit-msg` hook runs commitlint (see Pre-commit hooks).

## Build & validation commands

```bash
npm install              # first step after any checkout/pull
npm run build             # prebuild (tsc check) -> vp pack (tsdown: dist/bin + dist/mjs)
npm run test               # vp test (Vitest), __tests__/**/*.test.ts
npm run coverage         # vp test --coverage -> ./out/
npm run format            # vp fmt --write ./src ./__tests__
npm run check              # vp check ./src/ ./__tests__/ - CI's actual gate, no side effects
npm run lint:markdown  # markdownlint
npm run generate-docs  # regenerate README.md from action.yml
```

`npm run lint` runs `vp lint --type-aware --type-check ./src/ ./__tests__/` (Oxlint +
`tsgolint` type-checking, no format side effects) then `npm run lint:markdown`.
`lint:fix` runs the `--fix` variant plus `lint:markdown:fix`. `check`/`check:fix` run
`vp check`, which bundles format + lint + type-check in one pass — this is CI's actual
gate. No `prelint` hook exists anymore; there's no separate format/tsc pass hiding
behind `npm run lint`.

## Pre-commit hooks (husky)

- **pre-commit**: `vp staged && npm run build && npm run generate-docs && npm run lint:markdown`.
  - Gotcha: has silently dropped staged files despite exit 0.
  - Verify with `git show --stat HEAD` after committing.
- **commit-msg**: runs commitlint.
- **pre-push**: a no-op (commented out).

## dist/ files

- Gitignored, but a past release's snapshot may still be **tracked**.
- Check with `git ls-files dist/`.
- If tracked, a local rebuild shows as a _modification_, not an untracked file.
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
scripts/               release.sh, latest_valid_node_version.sh
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
  - `pull_request_target` evaluates the workflow _definition_ from the base branch, not the PR head —
    a PR changing `test.yml` itself (or removing a tool it still requires) can't show green pre-merge.
  - Bootstraps `vp` via `voidzero-dev/setup-vp` (pinned tag), then runs `vp check` before tests.
    Node versions tested: a dynamic matrix resolved from `.node-version` (see `node-version-matrix` job).
  - On `push` only, also invokes `deploy.yml`.
- **`push_code_linting.yml`** ("Code Linting Annotation")
  - Same bootstrap order as `test.yml`: `npm install` then `voidzero-dev/setup-vp`.
  - `vp lint --format github` and a markdownlint problem-matcher post inline PR
    annotations natively — no reviewdog involved.
- **`deploy.yml`** ("NPM Release Workflow")
  - Not push-triggered directly: `workflow_call` (from `test.yml`) + `repository_dispatch`.
  - Runs `npm ci` → engine/signature checks → bootstraps `vp` → build → commit dist/ → `semantic-release`.

## Config files

| File             | Purpose                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `action.yml`     | Action metadata — all inputs/outputs                                                                             |
| `.ghadocs.json`  | generate-docs config                                                                                             |
| `vite.config.ts` | Oxlint/Oxfmt rules, pre-commit staged-file config, `pack` (tsdown build), `test` (Vitest) — via Vite+'s `vp` CLI |
| `package.json`   | Deps, scripts, engines, volta                                                                                    |

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

- Plan: `docs/typescript-7-vite-plus-conversion-plan.md` (live, multi-phase).
- Done: TS7, and format/lint/staged/build/test all run through Vite+'s `vp` CLI.
- Remaining: a Phase 4 cleanup pass (see the plan doc). `semantic-release`/publishing
  intentionally stay outside Vite+ — a scoped decision, not a gap.
- A task needing a piece of that system is a signal to advance the plan, not work around the gap.

## Working discipline

- `.claude/skills/checker-principle/SKILL.md`: verify before trusting any fix, bot finding, or your own diff.
  - Symlinked under `.agents/skills/` — auto-loads in any agent that reads that path (per agentskills.io).
- `.claude/skills/pr-review-workflow/SKILL.md`: handling PR review comments, judging draft-readiness.
- `.claude/skills/planning-multi-step-work/SKILL.md`: planning ahead, judging when a loop is warranted.
- Delegate large reads (logs, search results, big docs) to a fresh, cheap-model subagent — cheaper per call.
  - The checker-principle still applies to what it reports back.
- Deferred work goes in GitHub Issues, not this file — this file is facts and
  conventions every agent needs, not a task backlog.
