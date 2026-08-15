# AGENTS.md

Instructions for AI agents working in this repository.

## What this tool is for

An action's interface lives in `action.yml`; the README users read is
hand-maintained, so it drifts. This is a one-way projector: it renders fixed
views of `action.yml` and splices each into the matching
`<!-- start X -->…<!-- end X -->` pair of a README. It runs against **arbitrary
third-party repositories**, not just this one — that is the contract that
matters when judging any change.

**Read [`docs/tool-contract.md`](docs/tool-contract.md) before changing
generation behaviour, touching bundling, or writing a test that asserts what the
output should look like.** It holds what the tool guarantees, what is prettier's
doing, how version resolution falls back, why convergence takes two passes, and
the defect class this project has paid for repeatedly. Two of its rules govern
every change made here:

- **Text outside the markers is the user's.** Rewriting any of it is a breaking
  change even when every test passes.
- **Most of what makes the output look tidy is prettier, not this tool.**
  Column padding, `**false**`, `key: ""` — all prettier. Asserting them against
  a third-party README proves nothing about this tool.

## Project facts

- CLI + GitHub Action. Syncs README.md from action.yml (title, description, inputs, outputs, usage, badges).
- TypeScript, Node `>=24.19.0 <30.0.0` (`package.json` `engines`).
- Build: `vp pack` (tsdown, via Vite+). Test: `vp test` (Vitest, via Vite+). Lint/format: Oxlint + Oxfmt via Vite+'s `vp` CLI, plus markdownlint.
- `semantic-release` and publishing sit outside Vite+ deliberately — leave them there.
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
`lint:fix` is the `--fix` variant plus `lint:markdown:fix`. `check`/`check:fix` run
`vp check`, which bundles format + lint + type-check in one pass — CI's actual gate.

## Pre-commit hooks (husky)

- **pre-commit**: `vp staged && npm run build && npm run generate-docs && npm run lint:markdown`.
  - Verify your staged files reached the commit with `git show --stat HEAD` (#671).
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
  prettier.ts                formatMarkdown/wrapDescription + the bundled plugin list
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
scripts/               release.sh, latest_valid_node_version.sh,
                       verify-readme-contract.mjs (run by integration-test.yml)
.github/workflows/  CI - file names differ from GitHub-displayed name: (see below)
docs/                    tool-contract.md
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
- **`integration-test.yml`** ("Integration Tests - Real World Repositories")
  - The only workflow that runs the built action against **third-party**
    repositories, and the only place the output contract is enforced. If you
    change generation behaviour, this is what catches it.
  - Has a plain `pull_request` trigger, unlike `test.yml` — so a PR changing
    this file does show its own effect pre-merge.
  - Runs `scripts/verify-readme-contract.mjs` against each target's own
    `action.yml`, then generates three times and asserts passes 2 and 3 match.
    See `docs/tool-contract.md` for why it is 2-vs-3 and not 1-vs-2.

These four are the ones that matter for a code change. The rest of the directory
is repo housekeeping (stale bot, assignment, tag cleanup, version updater).

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
5. Run `git fetch origin --tags` before `generate-docs`, and check the version it
   resolved in the README diff.
   - An incomplete tag set resolves to a real but older tag and reports nothing
     (#667). `actions/checkout` gives you exactly that by default.
6. Touching bundling (`vite.config.ts`, `src/prettier.ts`, externals) → run the
   built binary from a directory with no `node_modules` before believing it works.
   - `__tests__/integration-bundled-binary.test.ts` is the guard. A green
     `npm run build` and a green suite have repeatedly not caught this class.
   - `deps.alwaysBundle` entries match the **specifier**, not the package:
     `"prettier"` does not cover `prettier/standalone`.
7. `git restore dist/` reverts your build. `npm run generate-docs` runs
   `node dist/bin/index.js`, so anything after a restore uses the last released
   binary, not your change. Rebuild before every probe.
8. Generation converges on the **second** pass, not the first — see
   `docs/tool-contract.md`. Compare run 2 against run 3.

## Key details

- README markers: `<!-- start inputs -->...<!-- end inputs -->`.
- Dual-purpose: GitHub Action (action.yml inputs) and CLI (`.ghadocs.json`/args).
- Versioning: latest git tag, falls back to `package.json` — must match pitfall 5.

## Working discipline

- **Never write a defect into a repo file. Fix it, or open a GitHub Issue.**
  A bug is transient state, like "350 of 400 tests pass" — committing it
  guarantees a file that is wrong the day it is fixed, plus a second copy to
  maintain. This applies to every tracked file: docs, code comments, this one.
  The only permitted form is a rule you must code against today plus a link to
  its issue, never a description of the bug.
- `.claude/skills/checker-principle/SKILL.md`: verify before trusting any fix, bot finding, or your own diff.
- `.claude/skills/pr-review-workflow/SKILL.md`: handling PR review comments, judging draft-readiness.
- `.claude/skills/writing-for-agents/SKILL.md`: writing or editing this file, `docs/tool-contract.md`, or any skill.
- `.claude/skills/planning-multi-step-work/SKILL.md`: planning ahead, judging when a loop is warranted.
- Delegate large reads (logs, search results, big docs) to a fresh, cheap-model subagent — cheaper per call.
  - The checker-principle still applies to what it reports back.
- Deferred work goes in GitHub Issues. This file carries the facts and
  conventions every agent needs.
