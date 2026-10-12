# AGENTS.md

Instructions for agents working in this repository.

## Project contract

This project is a CLI and GitHub Action that projects `action.yml` metadata into marked sections of a README. Judge changes against arbitrary third-party repositories, not only this repository.

**Before changing generation behavior, version resolution, markers, formatting, bundling, or tests that assert README output, read [`docs/tool-contract.md`](docs/tool-contract.md).**

Keep these invariants in view:

- Text outside generated marker pairs belongs to the README author. Rewriting it is a breaking change.
- Formatting behavior is not generator behavior unless the generator owns it. `docs/tool-contract.md` defines that boundary.
- `semantic-release` and publishing deliberately remain outside Vite+. Do not fold them into the Vite+ toolchain.

## Working commands

Run `npm install` after a checkout or pull before diagnosing missing modules.

For ordinary code changes:

```bash
npm run check
npm run build
npm run test
```

Use `npm run lint:markdown` for Markdown. Use `package.json` for the complete script list and `vite.config.ts` for Vite+/Oxlint/Oxfmt/build/test configuration.

When source changes affect generated docs, build before `npm run generate-docs`; that command executes the built CLI.

## Task routes

Load the narrow source that owns the task instead of relying on cached repository summaries here:

- **Generation, README ownership, versioning, convergence, formatting, or bundles:** read `docs/tool-contract.md`.
- **Build, test, lint, or package-script behavior:** read `package.json` and `vite.config.ts`.
- **Git-hook behavior:** read the matching file under `.husky/` and the script it invokes in `package.json`.
- **CI behavior:** read the relevant file under `.github/workflows/`; workflow display names are not the source of truth.
- **Release behavior:** read the relevant workflow and the `release` configuration in `package.json`.
- **Before declaring a fix, review finding, or your own diff settled:** read `.claude/skills/checker-principle/SKILL.md`.
- **When handling PR feedback or deciding review readiness:** read `.claude/skills/pr-review-workflow/SKILL.md`.
- **When editing agent-facing instructions such as this file, `CLAUDE.md`, skills, or `docs/tool-contract.md`:** read `.claude/skills/writing-for-agents/SKILL.md`.
- **When planning substantial multi-step or repeated work:** read `.claude/skills/planning-multi-step-work/SKILL.md`.

## Release and commit semantics

Use Conventional Commits. The commit header that lands on `main` drives semantic-release.

For a breaking change, put `!` in both the PR title and the Conventional Commit header, for example `fix(scope)!: ...`, so the header that lands on `main` carries the marker. Do not rely on a `BREAKING CHANGE:` footer surviving the merge path.

Treat `dist/` as release-owned output. Local builds can modify tracked snapshots even though `dist/` is gitignored. Before an ordinary commit, discard those build changes with `git restore dist/`; the release workflow owns committing `dist/`.

## High-value gotchas

- `generate-docs` uses the built CLI. Rebuild after source changes and after any operation that restores or replaces `dist/`.
- Version output is tag-sensitive. Before trusting generated version text, fetch tags and inspect the version reported by generation; an incomplete tag set can resolve an older valid tag. See #667 and `docs/tool-contract.md`.
- Bundled runtime code must work without this repository's `node_modules`. When touching bundling, `vite.config.ts`, runtime dependency externalization, or `src/prettier.ts`, run the isolated packaged-binary coverage in `__tests__/integration-bundled-binary.test.ts`.
- `pull_request_target` evaluates the workflow definition from the base branch. When changing a workflow that uses it, do not treat a green pre-merge run as evidence that the changed workflow definition executed.

## Working discipline

Keep durable repository files about current rules and invariants, not transient defect state.

- Keep live defect narratives out of durable agent instructions and design docs. Fix the defect now; if it must be deferred and repository mutation is authorized, track it in a GitHub Issue. Otherwise report it to the user.
- Do not cache measurements such as test counts, file counts, percentages, or byte sizes as durable guidance unless the number itself is a contractual threshold. Prefer the invariant or the authoritative lookup.
