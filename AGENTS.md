# AGENTS.md

Instructions for AI agents (Claude, Codex, GitHub Copilot, and others) working
in this repository. This is the canonical, tool-agnostic source of project
details and process discipline. `CLAUDE.md` is a one-line `@AGENTS.md`
pointer, kept only because Claude Code looks for that path — GitHub
Copilot's coding agent and Copilot CLI read this file directly by default;
VS Code Copilot Chat reads it too, but only once its experimental
`chat.useAgentsMdFile` setting is turned on (off by default as of this
writing). No other *wrapper* file exists — `.claude/CLAUDE.md` still does,
separately, but holds only genuinely Claude-Code-specific content (banned
subagent types and the like) that doesn't belong in a tool-agnostic doc; it
isn't a pointer to here and isn't obsolete.

## Project Overview

**Purpose**: CLI tool and GitHub Action that generates/updates README.md files from action.yml metadata. Automatically extracts title, description, inputs, outputs, and usage examples from action.yml and updates corresponding sections in README.md using markdown comment delimiters.

**Type**: TypeScript-based Node.js project
**Supported Runtime**: Node.js `>=24.0.0 <30.0.0` (`package.json`'s `engines` field enforces this; 24 and 26 are both in CI's test matrix, Node 24 is just the Volta-pinned dev baseline, not the ceiling)
**Package Manager**: npm >=10.0.0
**Build Tool**: esbuild + TypeScript compiler
**Test Framework**: vitest
**Code Style**: Biome + Markdownlint (not ESLint — the repo migrated off ESLint; treat any lingering "ESLint" references elsewhere as stale)

## ⚠️ CRITICAL: Commit Message Format

**This repository uses Conventional Commits (enforced by commitlint + husky).**

**EVERY commit MUST follow this format:**

```text
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

⚠️ **IMPORTANT**: This project REQUIRES Node `>=24.0.0 <30.0.0` — `package.json`'s `engines` field strictly enforces this (24.x is the floor and CI's baseline dev pin, not the ceiling; CI's own test matrix includes 26.x). If you see `EBADENGINE` warnings during npm install, the environment is outside that range (most commonly: below it, e.g. Node 20 or 22). Node 20 reached end-of-life on 2026-04-30 and is no longer supported. The project uses volta for version management; check `.node-version` and `package.json`'s `volta` field directly for the exact pinned version rather than trusting a number restated here — it will drift out of sync with those files.

## Build & Validation Commands

### Installation & Build Sequence

**Always run commands in this exact order:**

1. **Install dependencies** (ALWAYS run first after any git checkout/pull):

   ```bash
   npm install
   ```

   - Known warnings: may show peer dependency warnings for @types/node (safe to ignore)
   - If below Node 24.0.0 or at/above Node 30.0.0: will show EBADENGINE warning (informational, but build still works) — Node 24-29 are all in range and won't trigger it

2. **Build the project** (REQUIRED before testing changes):

   ```bash
   npm run build
   ```

   - Runs in sequence: prebuild (tsc type-check) → build (esbuild) → postbuild (generate declarations + MJS build)
   - Output: Creates `dist/` directory with:
     - `dist/bin/index.js` - CLI executable
     - `dist/mjs/` - ESM modules
     - `dist/types/` - TypeScript declarations
   - Clean build: `npm run clean` (removes dist/) before `npm run build`

### Testing

```bash
npm run test          # Run tests in watch mode (vitest)
npm run coverage      # Run tests with coverage report (outputs to ./out/)
```

- Test files: `__tests__/**/*.test.ts`
- Coverage reports: Generated in `./out/coverage-summary.json` and `./out/coverage-final.json`

### Linting & Formatting

```bash
# Run all linting (format + type-check + biome + markdownlint)
npm run lint

# Auto-format code
npm run format          # Runs biome format on ./src ./__tests__

# Fix linting issues
npm run lint:fix        # Runs biome lint --fix + markdownlint --fix (does NOT reformat - run `npm run format` separately for that)
npm run lint:markdown:fix   # Fix markdown linting only
```

### Documentation Generation

```bash
npm run generate-docs
```

- Reads action.yml and updates README.md sections
- Generates branding SVG at `.github/ghadocs/branding.svg`
- Uses `.ghadocs.json` for configuration

### Complete Validation Sequence

**To validate your changes will pass CI, run these in order:**

```bash
npm install              # Install/update dependencies
npm run build           # Build project
npm run test            # Run tests
npm run coverage        # Generate coverage
npm run format          # Format code
npm run lint            # Biome lint + markdownlint (CI's actual lint gate - lint:markdown alone would miss the Biome check CI runs)
npm run generate-docs   # Update README
```

## Pre-commit Hooks

**Husky hooks are configured and WILL run automatically on commits:**

- **Pre-commit** (`.husky/pre-commit`): Runs `npm run pre-commit`
  - Executes: `lint-staged && npm run build && npm run generate-docs`
  - This means EVERY commit triggers a full build and docs regeneration
  - Staged files are auto-formatted via biome
  - **Known gotcha**: this hook has, at least once, silently dropped some
    staged files from the resulting commit despite a zero exit code — after
    committing, run `git show --stat HEAD` and confirm it actually contains
    everything you staged. Don't just trust the exit code.

- **Commit-msg** (`.husky/commit-msg`): Validates commit message format
  - Uses commitlint with conventional commits format
  - Example valid format: `feat: add new feature`, `fix: resolve bug`, `chore: update deps`

- **Pre-push** (`.husky/pre-push`): currently a no-op — its `npm run pre-push` line is commented out in the hook file. Don't rely on it catching anything before a push.

**Important**: If you make changes to action.yml, inputs.ts, or related files, the pre-commit hook will automatically update README.md. Include these updates in your commit.

## ⚠️ CRITICAL: Dist Files Workflow

**RULE: NEVER commit dist/ files manually. CI handles this automatically.**

### How Dist Files Work

1. **dist/ is gitignored** — but a past release's snapshot may still be
   **tracked** in git history (force-added by a release workflow run). Check
   `git ls-files dist/` before assuming it's untracked; if it returns files,
   `git status` will show any rebuild as local modifications to commit-worthy
   tracked files, not as new untracked ones.
2. **Developer commits source changes** (src/\*.ts, package.json, tests, etc.)
3. **Pre-commit hook runs** → rebuilds dist/ locally for validation
4. **CI deploy workflow** (`.github/workflows/deploy.yml`) commits dist/ during releases:
   ```bash
   npm run build --if-present
   git add -f dist          # Force-add bypasses .gitignore
   npm run generate-docs
   git commit -n -m 'build(release): bundle distribution files'
   npx --yes semantic-release@latest
   ```
5. **Released versions include dist/** - Users get the built files from release tags

### What You Should Do

✅ **ALWAYS do:**

- Run `npm install` as the FIRST step (auto-runs `husky install` via prepare script)
- Commit source code changes (src/, package.json, tests, etc.)
- Let pre-commit hook rebuild dist/ (this validates your changes work)
- If dist/ shows as modified after a local build, `git restore dist/` before
  committing anything else — don't hand-commit build output
- Push your commits normally

❌ **NEVER do:**

- `git add dist/` or `git add -f dist/`
- `git commit` with dist/ files included
- Bypass hooks with `HUSKY=0` unless investigating hook failures

## Project Structure

A hand-maintained file-by-file tree here would go stale the first time a file
is added or removed — use `Glob`/`ls` for the current, exact contents of any
directory rather than trusting a static listing. What's worth stating because
it's a convention, not visible from a directory listing alone:

- `__tests__/` follows `src/`'s naming for the files it does cover (e.g.
  `src/helpers.ts` → `__tests__/helpers.test.ts`), but coverage isn't
  exhaustive and nesting isn't always preserved (e.g. `src/markdowner/`
  maps to a flat `__tests__/markdowner.test.ts`, not a nested directory) —
  don't assume a 1:1 mirror when checking whether a given file has tests.
- `dist/` is gitignored, but a past release's tracked snapshot may still be
  present — see "Dist Files Workflow" above.
- `.github/workflows/`'s file names differ from their GitHub-displayed
  `name:` field — see "CI/CD Validation Pipeline" below.
- Top-level: `src/` (TypeScript source), `__tests__/` (Vitest tests),
  `scripts/` (build/release utility scripts), `.github/workflows/` (CI),
  `.husky/` (git hooks). Root config files are listed with their purpose in
  "Configuration Files Reference" below, not repeated here.

## CI/CD Validation Pipeline

Workflow file names differ from their GitHub-displayed `name:` field, noted
below. Read the workflow file directly (`.github/workflows/*.yml`) if a task
needs the exact, current step list — this section states what's
non-obvious, not a full transcription that will drift out of sync with it.

1. **`test.yml`** (displays as "Tag and Release Updated NPM Package"):
   - Triggers: `pull_request_target`; `push` to `main`/`next`/`beta`/`*.x`;
     `repository_dispatch` (type `semantic-release`). There is no plain
     `pull_request` trigger.
   - `run-tests` job matrix: Node `["24.0.0", "24.19.0", "26.x"]`. Steps
     include a `biome check` gate before tests run, and a coverage-report
     step, in addition to install/test/coverage/build/generate-docs.
   - On `push` events only, a second job invokes `deploy.yml` as a reusable
     workflow (see below) — that's one of `deploy.yml`'s two triggers, not
     its only one.

2. **`push_code_linting.yml`** (displays as "Code Linting Annotation"):
   - Triggers: `pull_request` and `push`, both to `main`/`next`/`beta`/`*.x`.
   - `biome lint` runs *before* `npm install` in this workflow, not after —
     the opposite order from `test.yml`'s `biome check` step. Reviewdog
     posts inline PR annotations from the lint step's output.

3. **`deploy.yml`** (displays as "NPM Release Workflow"):
   - Not push-triggered directly. Triggers: `workflow_call` (invoked from
     `test.yml`'s push-only job above) and `repository_dispatch` (type
     `semantic-release`).
   - Runs `npm ci`, a Node-engine compatibility check, an `npm audit
     signatures` provenance check, then build → `git add -f dist` +
     `generate-docs` + commit → `npx --yes semantic-release@latest`.

## Configuration Files Reference

| File                | Purpose                                             | When to Modify                                |
| ------------------- | --------------------------------------------------- | --------------------------------------------- |
| `action.yml`        | GitHub Action metadata - defines all inputs/outputs | When adding/changing action inputs or outputs |
| `.ghadocs.json`     | Tool configuration for README generation            | To customize README generation behavior       |
| `tsconfig.json`     | TypeScript compiler settings                        | When changing TypeScript compilation targets  |
| `tsconfig.build.json` | Declaration-only build config, `src/`-scoped, feeds `postbuild` | When changing what ships in `dist/types/` |
| `tsconfig-mjs.json` | TypeScript compiler settings for ESM                | For ESM-specific build configuration          |
| `biome.json`        | Lint/format rules and plugins                       | When modifying linting or formatting rules    |
| `vitest.config.ts`  | Test runner configuration                           | When modifying test setup                     |
| `package.json`      | Dependencies, scripts, engines, volta               | When adding deps or changing build scripts    |

## Common Pitfalls & Solutions

1. **Build fails with "Cannot find module"**: Run `npm install` first
2. **Tests fail after changes**: Run `npm run build` before testing
3. **README.md changes after commit**: Expected - pre-commit hook runs `generate-docs`
4. **Pre-commit hook slow**: Normal - it runs full build + docs generation
5. **EBADENGINE warning**: Node version outside `>=24.0.0 <30.0.0`
6. **`generate-docs` producing an unexpected README diff (e.g. version badge falling back to a full version string instead of a major tag)**: fetch git tags first (`git fetch origin --tags`) — the usage-example generator resolves the latest tag, and a shallow/tagless checkout makes it fall back to `package.json`'s version.

## Key Implementation Details

- **README markers**: Tool uses HTML comment delimiters like `<!-- start inputs --><!-- end inputs -->` to identify sections
- **Dual purpose**: Works as both GitHub Action (using action.yml inputs) and CLI tool (using .ghadocs.json or CLI args)
- **Branding**: Generates SVG icons from action.yml branding field using feather-icons
- **Versioning**: Auto-updates usage examples with the latest git tag, falling back to `package.json`'s version when tags aren't available (see the `generate-docs`/git-tags pitfall above — the two must stay consistent)
- **Configuration cascade**: CLI args → .ghadocs.json → action.yml defaults

## The standing goal for this repo's tooling migration

The end state is Vite+ driving the **entire** project lifecycle — format,
lint, build, test, package, and release — not a partial adoption running
alongside legacy tools. If a task in service of some other goal turns out to
need more of that system in place to actually complete, treat that as a
signal to bring the relevant piece of the Vite+ migration forward, rather
than working around the gap. See
`docs/typescript-7-vite-plus-conversion-plan.md` for the phased plan this
repo is following toward that end state.

## Instructions for Coding Agents

**Trust these instructions.** Only search the codebase if information here is incomplete or incorrect. Node version, install, and build requirements are covered above ("Critical: Node Version Requirement", "Build & Validation Commands") — not repeated here.

**Before committing:**

1. Run the full validation sequence (see "Complete Validation Sequence" above)
2. Review README.md changes if action.yml was modified
3. Ensure the commit message follows conventional commits format (see "Commit Message Format" above)

**When debugging:**

- Check dist/bin/index.js exists after build
- Verify `__tests__` mirrors `src/`'s structure
- `generate-docs` output wraps its step type in brackets when not inside a
  log group (e.g. `[ERROR  ]`, `[WARN   ]`, padded to a fixed width) —
  grep for these rather than assuming a fixed unpadded string.

## Independent verification (the checker principle)

An agent that writes a fix is the worst judge of whether the fix is correct — the
same reasoning that produced a mistake is the reasoning used to check for it.
When verifying whether a change actually resolves a review comment, bug report,
or finding:

- Never let the agent that wrote the fix also decide it's resolved (e.g. don't
  self-approve a change and then also close/resolve the review thread for it).
- Spawn a fresh-context agent for the check. Give it only the original
  comment/finding and the diff — never the reasoning that produced the fix. A
  checker that shares context with the worker isn't checking anything, it's
  agreeing with itself in a different window.
- Default to an adversarial framing: ask the checker to find a reason the fix
  does **not** resolve the issue, not to confirm that it does. Don't reward it
  for being agreeable.
- Subagents are you, just with clean, targeted context — spinning one up for
  this isn't outsourcing to someone else, it's using an isolated instance of
  yourself that hasn't seen, and isn't biased by, the work under review.
- Only mark something resolved (e.g. `resolve_thread`) after an independent,
  fresh-context pass says so — not on your own say-so, no matter how confident.

## Loop vs. one-off (when to automate a workflow)

A workflow earns a loop (plan → execute → check → iterate → stop) only when all
four hold at once:

- It recurs regularly, not once.
- It can grade itself — a condition that passes or fails without a human, or
  the same agent's own judgment, in the loop.
- Handing it a goal returns a result with no mid-loop intervention required.
- The stop condition is a fact (a status enum, an exit code), not a feeling.

Only the **status-check step** qualifies outright — polling a status enum
after a push and stopping on green is a fact-based check with nothing to
apply the four conditions against, it's just a read. **Iterating on
failure is a different action bundled under the same name, and it doesn't
get the same free pass**: choosing what to push next is a judgment call
(the same one the checker principle above exists to decorrelate from the
agent making it), and pushing repeatedly with no cap is exactly the
unbounded loop the four conditions are meant to rule out. Treat push →
check → iterate as a loop only with explicit bounds: a maximum number of
iterations, fixes that are safe to retry (idempotent — re-running one
doesn't compound on a half-applied previous attempt), and a point where
an unresolved failure surfaces for a human or an independent pass rather
than triggering another push on its own. "Is this review comment
actually addressed" does **not**
qualify on its own — it's a judgment call — but pairing it with the checker
principle above makes it tractable without pretending it's a fact.

## Before multi-step work: plan the graph, not just the next step

Before starting anything that will take more than a couple of turns, work out:

- What are the actual next steps toward the goal, not just the next one?
- Which of those steps have a real dependency on each other's output, and
  which are just typed in sequence (the "fake edge" test — draw an arrow
  between each consecutive pair, keep it only if data actually flows across
  it)? Independent steps should run concurrently — batched tool calls in one
  turn, or parallel background subagents — not queued one after another for
  no reason.
- Can a repeated mechanical step become a reusable script instead of being
  re-derived by hand each time it comes up?
- Does a step's own output change what later steps should be? Reorder the
  plan around that, rather than forcing the original sequence to hold.

## Handling incoming PR review comments (the recurring instance of all this)

1. Verify each comment against primary sources and the actual current
   file/repo state — don't accept or dismiss a bot finding on its wording
   alone.
2. Fix genuine gaps. When a detail can't be confirmed from documentation, run
   the real tool to get a real answer rather than leaving it as a guess (e.g.
   install the CLI and run `--help` instead of assuming what flags it takes).
3. Before resolving or closing a thread, hand the diff and the original
   comment — nothing else — to a fresh-context agent and get an explicit
   satisfied/not-satisfied verdict per the checker principle above.
4. Only resolve threads the checker actually confirms. Leave the rest open and
   iterate.
5. Batch: verify multiple independent comments in parallel, fix them in one
   edit pass, and run a single checker pass over all of them together rather
   than one comment at a time.

## PR draft-to-ready workflow

Draft is the correct starting state for a PR (per the standing convention of
opening PRs as draft), but it is not the resting state. Draft PRs get zero
real review — CodeRabbit posts "Review skipped: Draft detected" and stops;
human reviewers generally skip drafts too. Once you have applied your own
review pass to a PR's changes (read the diff, checked for the kind of issues
you'd flag in someone else's PR — a hygiene pass, not a substitute for the
checker principle above), mark it ready for review in the same session, not
"later." Concretely: call the "mark ready for review" / `draft: false`
update on the PR as soon as your own review pass is done.

## Session continuity

If a task file, backlog item, or long-running piece of work in this repo has
a place for open TODOs (e.g. a project-configuration file's own "TODOs"
section), treat it as shared state across sessions, not scratch notes for
one run: remove an entry once its work is actually done, and add one before
ending a session if real work remains and context is running out — so the
next session (yours or another agent's) picks up the actual state rather
than re-deriving it.

## Don't read what a cheap agent can read for you

Every tool call in your own turn re-processes your entire existing context — on a long session, that's expensive regardless of how small the individual output is. A fresh subagent (a cheap model) starts with none of that baggage, so it isn't just cheaper per call, it's cheaper by an order of magnitude for exactly the calls that are heaviest for you specifically: reading logs, search results, or large documents.

- If a step is "read this large/raw thing and tell me what matters," delegate it. Give the agent the source (a log, a URL, a file, a search query) and ask it to return only the synthesized finding plus a pointer back to the source (a file path and line, a URL, a quoted excerpt) — enough to independently verify the claim without having ingested the raw material yourself.
- This isn't a reason to explore less — it's a reason not to be the one doing the reading. Delegating the exploration doesn't delegate away scrutiny; the checker principle above still applies to what the agent reports back.
- Before waiting on your own turn to sequence two pieces of work, ask whether the second piece could have been written into the first agent's own instructions, or dispatched immediately (e.g. via the GitHub API instead of a local checkout, or with worktree isolation) so it never needs to contend with the first agent's state. Sequencing steps through your own turn just to avoid a hypothetical conflict is itself a cost that a little more upfront planning avoids.
- Don't schedule a wakeup to poll for a background agent's completion — it already notifies you when done. A scheduled poll on top of that is a redundant, wasted wakeup.

## State the hypothesis before acting, not after being corrected

An assumption you haven't tested is still an assumption, no matter how
confident it feels. If an action's correctness depends on something you
believe but haven't verified — a tool's default behavior, "this fix
addresses the comment," "this diff has no other issues" — that belief is a
hypothesis, not a fact, until something has actually tested it.

- Before acting on the assumption, name it as **Ha** (what you're about to
  rely on) versus **H0** (the way it could actually be), and test which is
  true with the cheapest available check — a single direct command, a read
  of the tool's own contract, one background agent — before committing
  further actions to the outcome. Verify with the first unit before batching
  the rest: dispatching three parallel agents on an unverified assumption
  about how they're each provisioned is finding out three times what one
  check would have told you once.
- This applies to self-assessment, not just tool mechanics. "This diff is
  correct" is a hypothesis about your own work, not a fact you get to assert
  by having written it — it gets the exact same checker-principle treatment
  as a bot's review comment: a fresh agent tests it, you don't declare it.
  Reading your own diff and calling it reviewed is not a substitute for
  independent review, even when a repo convention (e.g. "apply your own
  review pass before marking a PR ready") asks for a self-read first — that
  self-read is a hygiene pass, not the validation step.
- The failure mode this section exists to name: acting first and treating an
  external correction — a bot comment, a user question — as the test.
  Stating Ha/H0 before acting means the test happens before the action's
  consequences are already out in the world (agents already dispatched on a
  wrong premise, a PR already marked ready on an unverified diff), not
  after.

## TODOs

The list this repo's "Session continuity" practice above writes to. If you
complete one, remove it. If your session is ending with real work left, add
one here first.

- None
