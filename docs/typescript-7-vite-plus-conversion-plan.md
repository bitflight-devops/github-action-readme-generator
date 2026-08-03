# Conversion Plan: TypeScript 7 + Vite+ + Oxlint + Oxfmt

Status: **Proposed — clean cut-over, not an incremental migration.**
Scope: build, type-check, lint, format, test, and CI/CD toolchain only. No
runtime behavior of the generator changes.

## 1. Ground rules

- **Clean cut-over.** Every legacy config file this plan replaces is
  **deleted** in the same change set that introduces its replacement. We do
  not keep ESLint-era or Biome-era config "just in case," and we do not run
  two toolchains side by side past the cut-over PR.
- **Biome and Prettier are both fully removed as the repo's active
  linter/formatter.** No exception for either as *dev tooling*.
- **`prettier` the runtime dependency is a separate question, not an
  automatic exception.** `src/prettier.ts` calls `format(value, {...})`
  from the `prettier` package to format the README/YAML the *tool*
  produces for end users (`pretty`/`prettier` input in `action.yml`). That
  usage is a product feature, not our code-formatting tooling, so it isn't
  touched by the Biome/Prettier-as-formatter removal above by default —
  but it doesn't get a free pass either. I checked whether Oxfmt can
  replace it directly: it exposes a Node.js API,
  `format(filename, code, options) => Promise<{ code }>`, which is the
  same shape `src/prettier.ts` already calls. That makes replacement a
  real, testable option instead of something to assume away. §8.0 below
  lays out exactly what needs verifying before deciding to replace it
  versus keep `prettier` as a scoped runtime exception.

## 2. Validated facts (checked 2026-08-03, not assumed)

| Tool | Status found | Source |
|---|---|---|
| TypeScript 7.0 | GA July 8, 2026. The Go-native compiler ("Corsa"/tsgo) is now the standard `tsc` shipped in the `typescript` npm package — no separate package needed post-GA. `@typescript/native-preview`/`tsgo` binary name now only tracks nightlies. | [TypeScript 7.0 GA](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0-rc/), [npm](https://www.npmjs.com/package/@typescript/native-preview) |
| TS7 breaking changes relevant to us | `target: "es5"` and legacy `moduleResolution: "node"` are removed; `amd`/`umd`/`systemjs` module formats removed; `baseUrl`-only path resolution removed. All TS6 deprecations become hard errors. | migration coverage across multiple TS7 upgrade guides, Aug 2026 |
| Vite+ (`vite-plus`) | Public beta, MIT-licensed core, by the VoidZero/Oxc team. Bundles **Vite, Vitest, Rolldown, tsdown, Oxlint, Oxfmt** behind one CLI (`vp`) and one `vite.config.ts`. `vp check` = format + lint + type-check in one pass. `vp pack` builds **npm libraries (dual ESM/CJS) and standalone binaries** — this is our exact use case (CLI + library package). It **wraps your existing package manager** (npm/pnpm/yarn/bun) rather than replacing it. | [Vite+ Beta announcement](https://voidzero.dev/posts/announcing-vite-plus-beta), [viteplus.dev](https://viteplus.dev/), [GitHub](https://github.com/voidzero-dev/vite-plus) |
| Oxlint | Type-aware linting went stable July 22, 2026 via `tsgolint`, tracking TS 7.0.2, covering 59/61 `typescript-eslint` type-aware rules. 699 built-in rules total. Custom JS-authored plugin support is still **alpha**. **Does not lint Markdown.** | [Oxc blog](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable), [oxc-project/oxlint-action](https://github.com/oxc-project/oxlint-action) |
| Oxfmt | Beta since Feb 2026, at v0.62 as of today. Passes 100% of Prettier's JS/TS conformance suite; ~30x faster than Prettier. Formats JS/TS/JSON/YAML/TOML/HTML/**Markdown**/CSS/MDX, etc. | [Oxfmt Beta](https://oxc.rs/blog/2026-02-24-oxfmt-beta) |
| Oxfmt Node.js API | Exposes a programmatic API — `import { format } from "oxfmt"; const { code } = await format(filename, input, options)` — filename drives parser selection, options is a `FormatOptions` type. This is called out separately from the CLI because it's what `src/prettier.ts` would need to call `oxfmt` in-process instead of shelling out. **Not yet verified:** whether `FormatOptions` supports the exact knobs this repo's runtime code depends on (`semi`, `embeddedLanguageFormatting`, `proseWrap`) with matching output. | [Oxfmt Quickstart](https://oxc.rs/docs/guide/usage/formatter/quickstart.html), [npm](https://www.npmjs.com/package/oxfmt) |
| Node requirement | Vite 7+/Vite+ requires **Node 20.19+ or 22.12+**. TypeScript 7 requires Node 20+. | Vite release notes, TS7 docs |

**Consequence:** everything the user asked for (TS7, Vite+, oxlint, oxfmt)
is real, shipped (beta/GA, not vaporware), and fits this project's
Node-20-strict constraint — provided the floor moves from `>=20.11.0` to
`>=20.19.0`.

## 3. Current-state audit (what's actually here today)

Read directly from the repo, not from `.github/copilot-instructions.md`
(which is stale — it describes an ESLint-based setup; the repo has already
moved to **Biome**, not ESLint):

- **Lint/format:** `biome.json` (linter + formatter), plus a *separate*,
  redundant Prettier install used only for `format:prettier` and inside
  `.lintstagedrc`.
- **Two conflicting lint-staged configs exist simultaneously**:
  `.lintstagedrc` (`prettier --write` on `.ts,.js,.json,.md`) and a
  different `lint-staged` block inside `package.json` (`biome check --write`
  on ts, `prettier --write` on md/yaml/sh). Only one of these is ever
  actually read by `lint-staged`, depending on resolution order — this is a
  pre-existing bug, independent of this conversion, and gets resolved as a
  side effect of the cut-over (single `vp check --staged` config replaces
  both).
- **Build:** custom, hand-rolled two-step pipeline:
  `scripts/esbuild.mjs` bundles `src/index.ts` → `dist/bin/index.js` (ESM,
  Node20 target, with a hand-written CJS-interop shim banner), then
  `postbuild` runs `tsc --emitDeclarationOnly --outFile dist/types/index.d.ts`
  (single-file declaration bundling via `--outFile`, an unusual/fragile use
  of that flag) and a second `tsc -p tsconfig-mjs.json` pass to emit
  `dist/mjs/`, followed by `scripts/set_package_type.sh` writing a
  `{"type":"module"}` stub into `dist/mjs/`.
- **Gap found:** `package.json` declares `"main": "dist/cjs/index.js"` and
  a `require` export condition, but **no build step anywhere produces
  `dist/cjs/`**. This is currently dead/broken config — CJS consumers of
  this package would fail. The conversion is the natural point to either
  fix this for real (Vite+/tsdown can emit true dual ESM+CJS with one
  config) or deliberately drop the CJS entry point. This needs a decision
  (§8).
- **Type-check:** `tsc --noEmit` runs twice per cycle (`prebuild`, `prelint`).
  `tsconfig.json` extends `@tsconfig/node20`, already uses
  `moduleResolution: "NodeNext"` (not legacy `"node"`) and has no `baseUrl`
  — i.e. it's already clear of two of the three TS7 breaking changes.
  It does set `"ignoreDeprecations": "6.0"`, which must be removed (TS7 has
  no such escape hatch for 6.0 deprecations — they're hard errors).
- **Test:** Vitest 4.1 + `@vitest/coverage-v8`, config in `vitest.config.ts`,
  111 tests under `__tests__/`, including a regression test
  (`integration-bundled-binary.test.ts`) that asserts the bundled
  `dist/bin/index.js` is self-contained (no `ERR_MODULE_NOT_FOUND`) because
  `prettier`, a runtime dependency, must be bundled rather than externalized.
  **This constraint must be preserved exactly** in whatever bundler config
  replaces `esbuild.mjs`.
- **Dead config found:** `.babelrc.cjs` (targets `node 16`, legacy decorator
  plugin) — nothing in `package.json` scripts or CI invokes Babel. It is
  unused and gets deleted, independent of the TS7/Vite+ decision.
- **CI:** four workflows touch this toolchain —
  `test.yml` (matrix Node 20/24, `biome check`, `vitest`, `coverage`,
  `build`, `generate-docs`), `push_code_linting.yml` (`biome lint` +
  reviewdog PR annotations + `markdownlint`), `deploy.yml` (`npm ci`,
  `npm run build`, force-add `dist/`, `semantic-release`),
  `integration-test.yml` (builds the action, runs it against two real
  external repos end-to-end). `integration-test.yml` and the
  `markdownlint-cli`-based markdown linting are **out of scope for
  replacement** — oxlint doesn't lint Markdown, and the integration test
  only cares about the built artifact's behavior, not the toolchain that
  produced it.

## 4. Target architecture

```
vite.config.ts          # single config: build (lib mode, dual ESM/CJS + bin),
                         # test (vitest block), lint (oxlint block),
                         # format (oxfmt block), staged (pre-commit block)
tsconfig.json            # TS7, NodeNext, strict, no legacy flags
package.json              # scripts delegate to `vp <cmd>`
```

Replaces, 1:1:

| Deleted | Replaced by |
|---|---|
| `scripts/esbuild.mjs` | `vite.config.ts` → `build.lib` (Rolldown) |
| `tsconfig-mjs.json` | single `tsconfig.json`, tsdown handles dual-format emit |
| `scripts/set_package_type.sh` | `vp pack` writes correct per-format `package.json` stubs |
| `biome.json` | `vite.config.ts` → `lint` block (Oxlint) + `format` block (Oxfmt) |
| `.prettierrc.cjs`, `format:prettier` script | Oxfmt config in `vite.config.ts` (code only — **not** the runtime `prettier` dependency, see §1) |
| `.babelrc.cjs` | deleted outright (dead code, unrelated to this cut-over but found during the audit) |
| `.lintstagedrc` + the duplicate `lint-staged` block in `package.json` | `vite.config.ts` → `staged` block, driven by `vp check --staged` via Husky's `pre-commit` hook |
| `.eslintrc.cjs` | N/A — didn't exist; nothing to delete |

Kept, unchanged:

- `markdownlint-cli` + `.markdownlint.json` (+ `xt0rted/markdownlint-problem-matcher`
  in CI) — oxlint has no Markdown support, so prose/Markdown-structure
  linting stays on markdownlint. Oxfmt's Markdown formatting is optional
  and additive (§8.2, open decision).

Under active decision, not assumed either way:

- The `prettier` **runtime** dependency (`src/prettier.ts`) — see §1 and
  §8.0. Depending on the outcome, either it stays as a scoped exception,
  or it's replaced by `oxfmt`'s Node API and `prettier` is dropped from
  `dependencies` entirely.
- `.ghadocs.json`, `action.yml`, all of `src/`, `__tests__/` content
  (only import paths / test assertions touching `dist/` layout change).
- `husky` for the git hook *mechanism* (`.husky/pre-commit`,
  `.husky/commit-msg`, `.husky/pre-push`) — only *what* `pre-commit` shells
  out to changes (`vp check --staged` instead of `lint-staged`).
- `commitlint` + conventional commits enforcement — untouched, orthogonal
  to this conversion.
- `semantic-release` — untouched, but its `prepareCmd`/build step in
  `deploy.yml` now calls `vp pack` instead of `npm run build`.
- `vitest` as the test runner and its config semantics — Vite+ *bundles*
  Vitest rather than replacing it, so `__tests__/**` and
  `vitest.config.ts`'s `test` block move into `vite.config.ts` verbatim.

## 5. Node/engine version bump

Vite+ requires Node **20.19+ or 22.12+**. Current `engines.node` is
`>=20.11.0 <26.0.0` and `volta.node` is pinned to `20.9.0` (already
inconsistent with `engines` today — `20.9.0 < 20.11.0`). Action:

- Bump `engines.node` to `>=20.19.0 <26.0.0`.
- Bump `volta.node` to `20.19.0` (or the latest 20.x LTS patch at
  execution time) — stays inside the "strict Node 20.x" rule in
  `.github/copilot-instructions.md`, so that document's constraint is
  still honored; only its *tooling* sections (ESLint/Prettier references)
  need updating to describe Oxlint/Oxfmt/Vite+/TS7 instead.
- CI `test.yml` matrix currently pins `"20.0.0"` as one of its three
  versions — that value now fails the new floor and must become
  `"20.19.0"`.

## 6. `tsconfig.json` changes for TS7

- Remove `"ignoreDeprecations": "6.0"` (no longer a valid escape hatch).
- Keep `moduleResolution: "NodeNext"` / `module: "NodeNext"` (already
  TS7-safe).
- Confirm `@tsconfig/node20`'s `target` is ≥ `ES2015` (it is — `ES2022`),
  so no action needed there.
- Confirm no `baseUrl`-driven path mapping exists (it doesn't — no action).
- Drop the `tsconfig-mjs.json` split entirely; tsdown (inside `vp pack`)
  compiles once and emits both format outputs plus declarations from a
  single `tsconfig.json`, removing the double-`tsc`-pass and the
  `--outFile` declaration-bundling hack.
- Install: `npm install -D typescript@latest` (post-GA, `tsc` inside the
  regular `typescript` package *is* the native compiler — no `@rc` or
  `native-preview` package needed).

## 7. Build (`vite.config.ts`, `build.lib` via Rolldown / tsdown)

Requirements this config must satisfy, carried over from
`scripts/esbuild.mjs` and validated against the existing regression test
(`__tests__/integration-bundled-binary.test.ts`):

1. CLI entry (`src/index.ts`) bundled to a **self-contained** executable at
   `dist/bin/index.js` — `prettier` and all other `dependencies` must be
   **bundled in**, not left external, or the bundled-binary regression
   test fails exactly the way it's designed to catch.
2. Shebang / ESM interop banner (`#!/usr/bin/env node` + the
   `__filename`/`__dirname`/`require` polyfill shim) preserved via Rolldown's
   `output.banner`.
3. Node built-ins (`node:fs`, `node:path`, etc.) stay external — Rolldown
   supports this the same way esbuild's `external` array did.
4. Library entry points for `dist/mjs/` (ESM) and — pending the decision in
   §8 — `dist/cjs/` (CJS), plus a single, correctly-generated
   `dist/types/index.d.ts`, all produced by `vp pack` / tsdown in one pass
   instead of the current two-`tsc`-invocation dance.
5. `chmod +x dist/bin/index.js` — keep as an explicit post-step (or a small
   `vp pack` hook) since neither Rolldown nor tsdown sets the executable
   bit on its own.

## 8. Open decisions requiring your call

These are genuine product/scope decisions, not implementation details —
flagging them rather than silently picking one:

0. **Replace the runtime `prettier` dependency with `oxfmt`'s Node API,
   or keep `prettier` as a scoped exception?** `__tests__/prettier.test.ts`
   pins the exact option surface `src/prettier.ts` depends on today:
   `format(value, { semi: false, parser: 'yaml' | 'markdown',
   embeddedLanguageFormatting: 'auto', filepath? })` for
   `formatYaml`/`formatMarkdown`, and `format(value, { semi: false,
   parser: 'markdown', proseWrap: 'always' })` for `wrapDescription`. To
   replace this with `oxfmt`, each of the following needs to be checked
   against `oxfmt`'s `FormatOptions` type and confirmed to produce
   equivalent output, not just "no type error":
   - Does `FormatOptions` have a `proseWrap` equivalent (Markdown prose
     wrapping is used by `wrapDescription` to keep `action.yml` description
     comments line-wrapped)?
   - Does it have an `embeddedLanguageFormatting` equivalent, or does
     `oxfmt` handle embedded-code-block formatting inside Markdown/YAML
     by default with no toggle needed?
   - `oxfmt.format()` takes a **filename** (`format(filename, code, options)`)
     rather than an explicit `parser` string — need to confirm passing
     `"x.yaml"` / `"x.md"` as the filename argument reliably selects the
     same parser `parser: 'yaml'` / `parser: 'markdown'` did, including
     when the real caller passes a `filepath` for `README.md` /
     `action.yml`-derived paths.
   - `semi: false` — confirm the option name/semantics match.
   - Byte-for-byte (or at least structurally equivalent) output on a
     real generated `README.md` and a real `action.yml`, not just the
     unit-test mocks, since `prettier.test.ts` currently mocks `format`
     entirely and never asserts real formatted output.
   This verification is a **Phase 0 spike task** (§9), not something to
   decide from documentation alone. If it holds: drop `prettier` from
   `dependencies`, add `oxfmt` to `dependencies` (it moves from
   dev-tooling to a runtime dependency the same way `prettier` is today),
   rewrite `src/prettier.ts` against `oxfmt`'s API, update
   `__tests__/prettier.test.ts`'s mocks and expectations, and repurpose
   `__tests__/integration-bundled-binary.test.ts` (currently a regression
   test specifically for `prettier` bundling correctly) to guard `oxfmt`
   bundling instead. If parity doesn't hold on some option, keep
   `prettier` in `dependencies` as an explicitly-documented, scoped
   exception (update §1 and this section to say so) rather than force a
   worse README/YAML output to complete the cut-over.

1. **CJS entry point: fix for real, or drop it?** Today it's advertised in
   `package.json` but never actually built (§3). Vite+/tsdown can produce
   real dual ESM+CJS output at low marginal cost, so "fix it" is cheap —
   but if no consumer actually needs `require()` (this is primarily
   consumed as a GitHub Action / `npx` CLI), dropping the `require`
   export and `main` field and going ESM-only is a legitimate
   simplification and shrinks the cut-over's surface area. Recommend:
   confirm via npm download/issue history whether any consumer requires
   CJS before deciding; default to **fixing it for real** if unsure, since
   it's a published public package and removing an advertised entry point
   is a breaking change for someone we can't see.
2. **Oxfmt vs markdownlint overlap on Markdown.** Oxfmt can *format*
   Markdown; markdownlint *lints* it (prose rules, heading structure,
   etc.) — they're not the same job and can coexist, but running both means
   two tools touching `.md` files. Recommend: let Oxfmt format Markdown
   (replacing Prettier's role there, which `.lintstagedrc` already did),
   keep markdownlint strictly for structural/prose linting, unchanged.
3. **Biome custom rule parity.** `biome.json` has several
   project-specific rules (`useNamingConvention` with per-symbol-kind
   formats, `useFilenamingConvention`, `noExcessiveCognitiveComplexity`
   @ 25, `noExcessiveLinesPerFunction` @ 150, `noBarrelFile`,
   `noReExportAll`, `noDelete`, etc.) plus a per-directory override that
   relaxes several rules under `__tests__/**`. Oxlint has 699 rules and
   broad `typescript-eslint`-equivalent coverage, but a rule-by-rule
   mapping hasn't been done yet — that's implementation work, not
   research I should guess at. Recommend: do this mapping as the first
   concrete task of the execution phase (§9, Phase 2), and accept that a
   handful of Biome-specific rules (e.g. the exact cognitive-complexity
   threshold) may have no Oxlint equivalent and need to be dropped or
   left to code review.
4. **`vp migrate` vs hand-authored config.** Vite+ ships a `vp migrate`
   command that *preserves* existing config and *suggests* removing
   old tooling. That's an incremental-migration tool — it's the opposite
   of what was asked for ("not a migration, a clean cut-over"). Recommend:
   do **not** run `vp migrate`; hand-author `vite.config.ts` from scratch
   in Phase 2 and delete the legacy files in the same commit, per §1.

## 9. Execution phases

Sized to land as reviewable, independently-revertable PRs — "clean
cut-over" describes the *end state* (no dragged-along legacy config), not
"one giant unreviewable commit."

**Phase 0 — validation spike (no repo changes merged to main config yet)**
Prove the risky parts in isolation on a scratch branch before touching CI:
`npm i -D typescript@latest` and run `tsc --noEmit` as-is to see the real
diff of TS7 hard-error deprecations against this codebase; hand-write a
throwaway `vite.config.ts` `build.lib` block and confirm the bundled
`dist/bin/index.js` still passes `integration-bundled-binary.test.ts`
unmodified; run `oxfmt`'s Node API against a real generated `README.md`
and `action.yml` and diff the output against today's `prettier` output to
resolve §8.0 (runtime `prettier` replacement) before Phase 2 deletes
anything Prettier-related. This de-risks the plan before CI/config
deletion.

**Phase 1 — TypeScript 7 alone**
Upgrade `typescript` to `latest` (GA 7.0), fix the `tsconfig.json` per §6,
resolve whatever hard-error deprecations Phase 0 surfaced. Build/lint/test
toolchain unchanged. Smallest possible PR; isolates TS7 fallout from
tooling fallout.

**Phase 2 — Oxlint + Oxfmt (lint/format only, build unchanged)**
Author the Oxlint/Oxfmt config blocks, do the Biome→Oxlint rule mapping
(§8.3), delete `biome.json`, `.prettierrc.cjs`, `.babelrc.cjs`,
`.lintstagedrc`, the duplicate `lint-staged` `package.json` block. Apply
the §8.0 outcome from the Phase 0 spike: either rewrite `src/prettier.ts`
onto `oxfmt`'s API and drop `prettier` from `dependencies`, or leave
`src/prettier.ts` on `prettier` as a documented exception — this is the
phase where that decision actually lands in code, not just in the spike.
Update `.husky/pre-commit` to call the new check command. Update
`push_code_linting.yml` (swap `biomejs/setup-biome` + `biome lint` +
`mongolyy/reviewdog-action-biome` for `oxc-project/oxlint-action`,
keep the markdownlint step as-is).

**Phase 3 — Vite+ build (the big one)**
Introduce `vite-plus`, consolidate `vitest.config.ts` into `vite.config.ts`,
replace `scripts/esbuild.mjs` + `tsconfig-mjs.json` +
`scripts/set_package_type.sh` with `build.lib` per §7, resolve the CJS
decision (§8.1), delete the replaced files, rewrite `package.json`
scripts to `vp` commands, rewrite `test.yml` and `deploy.yml` build steps.
This phase is gated on Phase 0's spike having already proven the bundled
binary stays self-contained.

**Phase 4 — cleanup**
Bump `engines`/`volta` Node floor (§5), update
`.github/copilot-instructions.md` and `CLAUDE.md` to describe the new
toolchain instead of the stale ESLint/Prettier narrative, delete this
plan doc's TODOs once landed or fold its "current state" section into
project docs as history.

Each phase = one PR, green CI required before the next phase starts.
`integration-test.yml` is the final gate every phase must keep passing
unmodified — it exercises the built action end-to-end against real
external repos and is the best available signal that the cut-over hasn't
broken actual behavior.

## 10. Risk register

| Risk | Mitigation |
|---|---|
| TS7 hard-errors on patterns Biome/TS6 allowed | Phase 0 spike surfaces this before any deletion happens |
| Rolldown bundling breaks the "fully self-contained binary" guarantee | `integration-bundled-binary.test.ts` already exists and is the exact regression gate; keep it, run it every phase |
| Oxlint rule gaps vs. current Biome config silently loosen quality bar | Explicit rule-mapping task (§8.3) before deleting `biome.json`, not after |
| Replacing runtime `prettier` with `oxfmt` silently changes generated `README.md`/YAML output for every consumer of this action | §8.0 verification (real-file diff, not just unit-test mocks) happens in the Phase 0 spike, before Phase 2 touches `src/prettier.ts`; if parity doesn't hold, keep `prettier` rather than ship a regression |
| `vp` toolchain still "beta" — API/CLI surface can change under us | Pin `vite-plus` (and its bundled Oxlint/Oxfmt/tsdown versions) to exact versions in `package.json`, not ranges, until it reaches stable/1.0 |
| Node floor bump to 20.19+ breaks some consumer pinned to older 20.x | Called out explicitly in the PR description / changelog as a `feat!`/breaking change per this repo's conventional-commits rules |
| `semantic-release` / `deploy.yml`'s `git add -f dist` step assumes today's `dist/` layout | Verify `dist/bin`, `dist/mjs`, `dist/types` (and `dist/cjs` if kept) paths match after `vp pack`, update the force-add + `files` array in `package.json` if paths shift |

## 11. Rollback

Each phase lands as its own PR against a real base branch with CI green
before merge, so rollback is `git revert` of that phase's merge commit —
no phase depends on hand-edits outside its own PR, so reverting Phase 3
doesn't require also reverting Phase 1/2.
