# Conversion Plan: TypeScript 7 + Vite+ + Oxlint + Oxfmt

Status: **Proposed — clean cut-over, not an incremental migration.**
Scope: build, type-check, lint, format, test, and CI/CD toolchain. One
exception to "no runtime behavior changes," and it's a non-change: §8.0
evaluated replacing the `prettier` runtime dependency (which formats the
README/YAML this tool generates for _end users_, not our own source) with
`oxfmt`'s API, and Phase 0's spike settled it — `prettier` stays. Nothing
in this plan touches generator output.

## 1. Ground rules

- **Clean cut-over.** Every legacy config file this plan replaces is
  **deleted** in the same change set that introduces its replacement. We do
  not keep ESLint-era or Biome-era config "just in case," and we do not run
  two toolchains side by side past the cut-over PR.
- **Biome and Prettier are both fully removed as the repo's active
  linter/formatter.** No exception for either as _dev tooling_.
- **`prettier` the runtime dependency is a separate question, not an
  automatic exception.** `src/prettier.ts` calls `format(value, {...})`
  from the `prettier` package to format the README/YAML the _tool_
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

| Tool                                                       | Status found                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Source                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TypeScript 7.0                                             | GA July 8, 2026. The Go-native compiler ("Corsa"/tsgo) is now the standard `tsc` shipped in the `typescript` npm package (verified directly against the npm registry: `typescript`'s `latest` tag is `7.0.2`, `bin.tsc`, plus 20 per-platform `optionalDependencies`) — no separate package needed post-GA. `@typescript/native-preview`/`tsgo` binary name now only tracks nightlies (registry `latest` tag is a dated dev build, not a release).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | [TypeScript 7.0 GA announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), [`typescript` on npm](https://www.npmjs.com/package/typescript)                                                                                                                                                                  |
| TypeScript 7.0 has **no public programmatic compiler API** | This is a real, general-ecosystem finding: tools that call into TypeScript's JS API directly (`typescript-eslint`, `ts-node`, `ts-morph`, `ts-jest`, template checkers behind Vue/Svelte/Astro) don't work against the `typescript` 7.0 package — the API returns in TS 7.1 (planned). Microsoft ships `@typescript/typescript6` as a compatibility shim for consumers that still need it. **Checked whether it actually applies to this repo, rather than assuming it does because it's a known industry risk:** `package.json` has no `typescript-eslint`, `ts-jest`, or `ts-morph` anywhere — this repo was never exposed to those. The one real hit was `ts-node: ^10.9.1` in `devDependencies`; `grep` across `scripts/` and `.github/` found zero invocations of it. **Decided: it's dead weight, same as the already-found `.babelrc.cjs`, and gets removed in Phase 1 — not aliased to `@typescript/typescript6`.** Oxlint's `tsgolint` doesn't need this compatibility path either — it vendors its own TS7.0.2 checker directly rather than calling into this repo's installed `typescript` package (confirmed against `tsgolint`'s own versioning-scheme docs). Net result: once `ts-node` and `.babelrc.cjs` are gone, this repo has no known consumer of the TypeScript programmatic API left. Phase 0 still runs a cheap confirmation pass before deleting anything (see §6) — insurance against something unexpected, not because the outcome is actually in doubt. | [TS7 GA announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/), coverage corroborating the same claim across independent sources, Aug 2026                                                                                                                                                                  |
| TS7 breaking changes relevant to us                        | `target: "es5"` and legacy `moduleResolution: "node"` are removed; `amd`/`umd`/`systemjs` module formats removed; `baseUrl`-only path resolution removed. All TS6 deprecations become hard errors.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | migration coverage across multiple TS7 upgrade guides, Aug 2026                                                                                                                                                                                                                                                                          |
| Vite+ (`vite-plus`)                                        | Public beta, MIT-licensed core, by the VoidZero/Oxc team. Bundles **Vite, Vitest, Rolldown, tsdown, Oxlint, Oxfmt** behind one CLI (`vp`) and one `vite.config.ts`. Checked the real config surface directly against `viteplus.dev/config/` rather than guessing: the documented blocks are `create`, `run`, `fmt` (Oxfmt), `lint` (Oxlint), `check` (`vp check` defaults — format + lint + type-check together), `test` (Vitest), `pack` (tsdown — this is what builds **npm libraries, dual ESM/CJS, and standalone binaries**, our exact use case), and `staged` (staged-file checks, via `vp staged`). There is no `format` block — that name doesn't exist in the real API; earlier drafts of this plan used it and were wrong. It **wraps your existing package manager** (npm/pnpm/yarn/bun) rather than replacing it. Migrating onto it means rewriting `vitest` imports to `vite-plus/test` (and `@vitest/browser*` to `vite-plus/test/browser*`) per its own migration docs.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | [Vite+ Beta announcement](https://voidzero.dev/posts/announcing-vite-plus-beta), [viteplus.dev/config/](https://viteplus.dev/config/), [viteplus.dev/guide/commit-hooks](https://viteplus.dev/guide/commit-hooks), [viteplus.dev/guide/migrate](https://viteplus.dev/guide/migrate), [GitHub](https://github.com/voidzero-dev/vite-plus) |
| Oxlint                                                     | Type-aware linting went stable July 22, 2026 via `tsgolint`, tracking TS 7.0.2, covering 59/61 `typescript-eslint` type-aware rules. 699 built-in rules total. Custom JS-authored plugin support is still **alpha**. **Does not lint Markdown.** `tsgolint` versions itself as `<TS version><patch>` (e.g. `7.0.2000` = TS 7.0.2, tsgolint patch 0) — its compatibility is tied to an _exact_ TypeScript release, not a range, so `typescript` and `oxlint-tsgolint` must be pinned to whatever the currently-compatible pair is, not installed via `@latest` independently (see §6).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | [Oxc blog](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable), [oxc-project/oxlint-action](https://github.com/oxc-project/oxlint-action)                                                                                                                                                                                          |
| Oxfmt                                                      | Beta since Feb 2026, at v0.62 as of today. Passes 100% of Prettier's JS/TS conformance suite; ~30x faster than Prettier. Formats JS/TS/JSON/YAML/TOML/HTML/**Markdown**/CSS/MDX, etc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | [Oxfmt Beta](https://oxc.rs/blog/2026-02-24-oxfmt-beta)                                                                                                                                                                                                                                                                                  |
| Oxfmt Node.js API                                          | Exposes a programmatic API — `import { format } from "oxfmt"; const { code } = await format(filename, input, options)` — filename drives parser selection, options is a `FormatOptions` type. This is called out separately from the CLI because it's what `src/prettier.ts` would need to call `oxfmt` in-process instead of shelling out. **Not yet verified:** whether `FormatOptions` supports the exact knobs this repo's runtime code depends on (`semi`, `embeddedLanguageFormatting`, `proseWrap`) with matching output.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | [Oxfmt Quickstart](https://oxc.rs/docs/guide/usage/formatter/quickstart.html), [npm](https://www.npmjs.com/package/oxfmt)                                                                                                                                                                                                                |
| Node requirement                                           | Vite 7+/Vite+ requires **Node 20.19+ or 22.12+**. TypeScript 7 requires Node 20+.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Vite release notes, TS7 docs                                                                                                                                                                                                                                                                                                             |

**Consequence:** everything the user asked for (TS7, Vite+, oxlint, oxfmt)
is real, shipped (beta/GA, not vaporware). It does **not** fit this
project's current "strict Node 20.x" constraint, though — Node 20 is
itself end-of-life as of 2026-04-30 (see §5, revised). The Node floor
needs to move to Node 24 (Active LTS), not just far enough to clear
Vite+'s stated 20.19+ minimum.

## 3. Current-state audit (what's actually here today)

Read directly from the repo, not from `.github/copilot-instructions.md`
(which is stale — it describes an ESLint-based setup; the repo has already
moved to **Biome**, not ESLint):

- **Lint/format:** `biome.json` (linter + formatter), plus a _separate_,
  redundant Prettier install used only for `format:prettier` and inside
  `.lintstagedrc`.
- **Two conflicting lint-staged configs exist simultaneously**:
  `.lintstagedrc` (`prettier --write` on `.ts,.js,.json,.md`) and a
  different `lint-staged` block inside `package.json` (`biome check --write`
  on ts, `prettier --write` on md/yaml/sh). Only one of these is ever
  actually read by `lint-staged`, depending on resolution order — this is a
  pre-existing bug, independent of this conversion, and gets resolved as a
  side effect of the cut-over (single `vp staged` config replaces
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
- **Dead source found:** `scripts/editorconfig.ts` and `scripts/formatter.ts`
  — checked whether these are what `ts-node`/the `"ts-node": {"esm": true}`
  block in `tsconfig.json` actually runs (the natural candidate, since
  they're the only loose `.ts` files that would need direct execution).
  They aren't invoked anywhere — zero references in `package.json` scripts,
  `.github/`, or `.husky/`. `scripts/editorconfig.ts` imports `editorconfig`,
  a package that isn't in `dependencies`, `devDependencies`, or even
  `package-lock.json` — it would fail on its first line if ever run.
  `scripts/formatter.ts` still has a stray `/* eslint-disable
promise/no-nesting */` directive, a leftover from before the ESLint→Biome
  move. Neither error ever surfaces because `tsconfig.json`'s `exclude`
  already has `scripts/**` — these files sit outside type-checking
  entirely. Both are dead, same category as `.babelrc.cjs`, and get
  deleted alongside it.
- **What actually replaces `ts-node`, if anything ever needs to run a
  `.ts` file directly again:** nothing needs to — Node 24 (this repo's
  target floor, see §5) has _stable, default-enabled_ native TypeScript
  execution (type stripping went stable in Node v24.12.0): `node
script.ts` just runs, no `ts-node`/`tsc`/build step. That's the real
  answer to "what replaces `ts-node`" — not another package, the runtime
  itself now does it. (Type stripping doesn't type-check — `tsc --noEmit`
  in CI still does that job, unchanged by this.) Source: [Node.js docs —
  Modules: TypeScript](https://nodejs.org/api/typescript.html) (primary,
  official).
- **`typescript-eslint` and `ts-morph` need no replacement because they
  were never here to begin with** — checked `package.json` directly:
  neither is a dependency of this repo, in any form, today. The general
  industry risk of TS7 breaking tools that depend on the old programmatic
  compiler API (§2) doesn't apply to this repo via those two, because
  they were never in the dependency tree for it to break. The tool that
  _is_ here doing type-aware linting today, Biome, isn't affected either
  — Biome doesn't use the TypeScript compiler API. Going forward, Oxlint
  (via `tsgolint`, which vendors its own TS7.0.2 checker rather than
  calling into this repo's installed `typescript`) is the "native"
  replacement for that category of tooling — already the plan's Phase 2,
  not a new decision this raises.
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

```ts
vite.config.ts          # single config: fmt (oxfmt block), lint (oxlint
                         # block), check (vp check defaults), staged
                         # (pre-commit block) — landed in Phase 2;
                         # pack (tsdown, CLI+library build) and test
                         # (vitest block) — landed in Phase 3
tsconfig.json            # TS7, NodeNext, strict, no legacy flags
package.json              # scripts delegate to `vp <cmd>`; exports only
                           # the `import` condition + `types` — no `require`
                           # / `main`, per §8.1
```

Replaces, 1:1:

| Deleted                                                               | Replaced by                                                                                     |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `scripts/esbuild.mjs`                                                 | `vite.config.ts` → `pack` block (tsdown), ESM-only output — see §7                              |
| `tsconfig-mjs.json`                                                   | single `tsconfig.json`, tsdown emits `dist/mjs/` + declarations                                 |
| `scripts/set_package_type.sh`                                         | `vp pack` writes the correct `dist/mjs/package.json` stub                                       |
| `biome.json`                                                          | `vite.config.ts` → `lint` block (Oxlint) + `fmt` block (Oxfmt)                                  |
| `.prettierrc.cjs`, `format:prettier` script                           | Oxfmt config in the `fmt` block (code only — **not** the runtime `prettier` dependency, see §1) |
| `.babelrc.cjs`                                                        | deleted outright (dead code, unrelated to this cut-over but found during the audit)             |
| `.lintstagedrc` + the duplicate `lint-staged` block in `package.json` | `vite.config.ts` → `staged` block, driven by `vp staged` via Husky's `pre-commit` hook          |
| `.eslintrc.cjs`                                                       | N/A — didn't exist; nothing to delete                                                           |

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
- `husky` for the git hook _mechanism_ (`.husky/pre-commit`,
  `.husky/commit-msg`, `.husky/pre-push`) — genuinely unchanged, verified
  by reading it: `.husky/pre-commit` is two lines, `. "$(dirname
"$0")/_/husky.sh"` then `npm run pre-commit`. It doesn't invoke
  `lint-staged` itself. **Correction to an earlier pass of this plan**,
  which said the hook file gets updated — it doesn't. What changes is
  the `pre-commit` _npm script_'s body (`lint-staged` → `vp staged`), per
  the full script audit below.
- `commitlint` + conventional commits enforcement — untouched, orthogonal
  to this conversion.
- `semantic-release` — untouched. `deploy.yml`'s build step **stays
  `npm run build`**, not a direct `vp pack` call — correction from an
  earlier pass of this plan, which had this backwards. `npm run build`
  itself gets rewritten to wrap `vp pack` (per the script audit below),
  including its `rimraf dist out` cleanup and `chmod` step. Calling
  `vp pack` directly from `deploy.yml` would skip that cleanup, and since
  release checkouts already contain a committed `dist/` tree, stale
  files the new pack config no longer produces could survive into the
  force-added release commit.
- `vitest` as the test runner and its config semantics — Vite+ _bundles_
  Vitest rather than replacing it, so `__tests__/**` and
  `vitest.config.ts`'s `test` block move into `vite.config.ts` verbatim.

### Full `package.json` scripts audit

Every entry in the current `scripts` block, reviewed individually —
not just the ones review comments happened to flag. Read directly from
`package.json`, not from memory of earlier passes of this plan (which
is how the `.husky/pre-commit` mistake above happened):

| Script                                                       | Current                                                                                                    | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`                                                        | `npm run build && npm run format && npm run lint && npm run test`                                          | No direct edit — picks up whatever `build`/`format`/`lint`/`test` become automatically once those are rewritten below. Re-check for redundancy once `vp check` exists (it already does format + lint + type-check together; chaining separate `format`/`lint` steps afterward may be pointless)                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `prebuild`                                                   | `tsc --project tsconfig.json --noemit`                                                                     | Keep through Phase 1/2. Revisit in Phase 3 — tsdown/`vp pack` doesn't type-check by default, so an explicit pre-build type-check likely still needs to exist somewhere, just possibly via `vp check` instead of a raw `tsc` call. Decide in Phase 3, don't assume either way now                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `build`                                                      | `rimraf dist out;node ./scripts/esbuild.mjs && chmod +x dist/bin/index.js`                                 | Phase 3: `rimraf dist out && vp pack && chmod +x dist/bin/index.js` — `chmod` stays explicit per §7 item 5 (neither Rolldown nor tsdown sets the executable bit)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `postbuild`                                                  | `tsc --emitDeclarationOnly ... --outFile ... && tsc -p tsconfig-mjs.json && ./scripts/set_package_type.sh` | **Phase 1 conditional, Phase 3 final.** Final state (Phase 3): **delete entirely** — `vp pack` does declaration generation, dual-format output, and the `dist/mjs/package.json` stub in one pass (§4's replaces-table already says this). **But if Phase 0's spike (§9 Phase 0) reproduces TS7 rejecting `--outFile`, this script cannot wait for Phase 3** — Phase 1 must land a working interim declaration-emit command in this same row, replacing just the `--outFile` invocation (not the whole script) so `npm run build` stays green through Phases 1–2. This row was previously silent on that contingency, which is the same gap flagged for Phase 1's prose below                                                                 |
| `build:docker`, `build:docker:default`, `build:docker:win32` | delegate to `npm run build` in a container                                                                 | No change — they wrap whatever `build` becomes. Node image tag already fixed to `node:24-alpine` (#616, merged to `main`). **Distinct from the root `Dockerfile`** (`FROM node:26.5.0`) — that file is an unrelated, Dependabot-managed devcontainer/sandbox image (`docker/node-*` PRs, e.g. #583/#569/#560/#550) that just `tail -f /dev/null`s; it isn't invoked by these scripts or by any build/release path, and `26.5.0` already satisfies `engines.node`'s `>=24.0.0 <30.0.0` range, so it needs no change for this plan. If this plan branch's checkout still shows `node:20-alpine` here, that means the branch predates #616 and needs `git rebase origin/main`, not a second copy of the same fix                                |
| `clean`                                                      | `rimraf dist`                                                                                              | No change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `commit`                                                     | `git-cz`                                                                                                   | No change — commitizen, orthogonal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `corepack`                                                   | `corepack enable`                                                                                          | No change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `current-version`                                            | `jq -r '.version' package.json`                                                                            | No change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `format`                                                     | `biome format --write ./src ./__tests__`                                                                   | Phase 2: → `vp fmt`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `format:check`                                               | `biome format ./src ./__tests__`                                                                           | Phase 2: → `vp fmt`'s check-mode equivalent (confirm exact flag via `vp fmt --help` at execution time)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `format:prettier`                                            | `prettier --write . --config .prettierrc.cjs --ignore-unknown`                                             | Phase 2: **delete** — `.prettierrc.cjs` is deleted (§1/§4); this script breaks the moment that happens. (Previously only implied by §4's table, not stated as a script deletion — fixed here)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `generate-docs`                                              | `node dist/bin/index.js && git add ...`                                                                    | No change — `dist/bin/index.js` path stays stable (§7)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `postinstall`                                                | `echo '✨ Successfully Installed'`                                                                         | No change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `prelint`                                                    | `npm run format && tsc --project tsconfig.json --noemit`                                                   | Phase 2: **delete** — redundant once `vp check` does format + lint + type-check together                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lint`                                                       | `npm run lint:biome && npm run lint:markdown`                                                              | Phase 2: body must change to reference `lint:biome`'s new name (see next rows) — **a real cross-reference that earlier passes of this plan missed**: renaming `lint:biome` without updating `lint`'s body breaks `lint`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `lint:fix`                                                   | `npm run lint:biome:fix && npm run lint:markdown:fix`                                                      | Same dependency — update in lockstep with `lint:biome:fix`'s rename                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `lint:biome`                                                 | `biome lint ./src/ ./__tests__/`                                                                           | Phase 2: rename the script key to `lint:oxlint` (a script still named `lint:biome` after Biome is deleted is the same stale-naming problem this plan keeps finding elsewhere) and its body to `vp lint`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `lint:biome:fix`                                             | `biome lint --write ./src/ ./__tests__/`                                                                   | Same: rename to `lint:oxlint:fix`, body → `vp lint --fix`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `check`                                                      | `biome check ./src/ ./__tests__/`                                                                          | Phase 2: → `vp check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `check:fix`                                                  | `biome check --write ./src/ ./__tests__/`                                                                  | Phase 2: → `vp check`'s fix-mode equivalent (confirm flag via `vp check --help`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `markdownlint`                                               | `markdownlint` (bare, no args or config)                                                                   | **Found, unrelated to this conversion**: nothing invokes this script anywhere — grepped `package.json`, `.github/`, `.husky/`, only the definition itself exists. A different, unconfigured duplicate of `lint:markdown`. Flagging as discovered dead/redundant cruft; not blocking this plan, but worth a separate cleanup                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `lint:markdown`, `lint:markdown:fix`                         | markdownlint with real config/args                                                                         | No change — markdownlint stays (§1/§4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pre-commit`                                                 | `lint-staged && npm run build && npm run generate-docs`                                                    | Phase 2 (sequenced last, per above): `lint-staged` → `vp staged`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `prepare`                                                    | husky-install guard                                                                                        | Phase 2: **body changes** — add a `command -v vp \|\| curl -fsSL https://viteplus.dev/install.sh \| bash` (or equivalent) check before/alongside the existing `husky install` guard, so local `vp` provisioning is a consequence of `npm install` rather than a documented instruction (see §9 Phase 2's local-bootstrap fix). Not "No change" — an earlier pass of this plan's table left this row stale after the prose above it already committed to editing `prepare`                                                                                                                                                                                                                                                                    |
| `semantic-release`                                           | `semantic-release`                                                                                         | No change — not even what `deploy.yml` calls (that runs `npx semantic-release@latest` directly); this script is a manual/local convenience, unaffected                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `test`                                                       | `vitest`                                                                                                   | Phase 3: → `vp test` — **confirmed empirically, not just from docs**: installed `vp` v0.2.8 via Vite+'s own install script and ran `vp test __tests__/helpers.test.ts` directly against this repo; it invoked Vitest v4.1.10 under the hood and passed all 42 tests. `vp test --help`'s own usage examples show `vp test`, `vp test src/foo.test.ts`, `vp test watch --coverage`                                                                                                                                                                                                                                                                                                                                                             |
| `coverage`                                                   | `vitest run --coverage`                                                                                    | Phase 3: → `vp test --coverage` (`run` is the default mode, so no `run` subcommand needed; `--coverage` is a documented top-level flag). **Confirmed the flag exists, but also confirmed it fails today without the Phase 3 dependency-reconciliation step landing first**: running `vp test --coverage` against this repo (before `vite-plus` is a local devDependency) threw `Cannot find package '@vitest/coverage-v8'` — the coverage package must resolve against whatever Vitest version `vite-plus` bundles (currently 4.1.10, not this repo's pinned `^4.1.2`), which is exactly the version-alignment requirement §9 Phase 3 already specifies. Direct empirical confirmation that requirement is load-bearing, not optional polish |
| `version:manual`, `postversion:manual`                       | manual release helpers using `::set-output name=X::Y`                                                      | **Found, unrelated to this conversion**: not invoked anywhere (grepped `.github/`, `.husky/`), and `::set-output` is deprecated GitHub Actions syntax. Flagging as discovered dead/stale cruft, not something this plan needs to fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## 5. Node/engine version — revised: Node 20 is EOL, target Node 24, not 20.19+

**Status: done.** This section's recommendation was executed as its own
PR ahead of the rest of this plan, exactly as suggested below — #614
(Node floor bump) merged, with a follow-up (#616) for two things Codex's
review caught after #614 merged (Docker build images still on
`node:20-alpine`, lockfile `engines` unsynced). The rest of this section
is kept as-is for the record of what was checked and why, not as an
open task.

Originally this section just covered Vite+'s minimum (Node 20.19+/22.12+).
That undersold the problem. Checked the actual Node.js LTS schedule as of
today (2026-08-03):

| Line    | Status (2026-08-03)                                   | EOL                             |
| ------- | ----------------------------------------------------- | ------------------------------- |
| Node 20 | **End-of-life** — no longer receives security patches | **2026-04-30 (already passed)** |
| Node 22 | Maintenance LTS                                       | 2027-04-30                      |
| Node 24 | **Active LTS**                                        | 2028-04-30                      |
| Node 26 | Current; becomes Active LTS                           | 2026-10-28 (becomes LTS)        |

Sources: [nodejs.org/dist/index.json](https://nodejs.org/dist/index.json)
(fetched directly — each release entry's `lts` field is the primary
signal: `false` for Node 26 as of this check, a codename string for 22/24),
[nodejs/Release](https://github.com/nodejs/Release) (the official
schedule this index reflects).

`.github/copilot-instructions.md`'s "STRICT Node 20.x" rule and this
repo's `engines.node` (`>=20.11.0 <26.0.0`)/`volta.node` (`20.9.0`)/
`.node-version` (`20.x`) are all pinned to an already-EOL line. That's a
correctness problem independent of whether TS7/Vite+/Oxlint/Oxfmt happen
at all — it should be treated as its own fix, not bundled as a footnote
of this conversion.

**More urgent than our own dev tooling: `action.yml`'s `runs: using:
"node20"` is on a hard deprecation clock set by GitHub, not by us.**
GitHub started defaulting hosted runners to Node 24 for JavaScript
actions in 2026, and is removing Node 20 support from hosted runners
entirely later in fall 2026 — after that, any action still declaring
`using: "node20"` stops working outright, regardless of anything in this
plan. This needs `using: "node24"` before that removal date, full stop.
Source: [GitHub Changelog — Deprecation of Node 20 on GitHub Actions
runners](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/).

**Evidence already in this repo pointing the same direction, found by
reading the workflow files, not assumed:** `test.yml`'s CI matrix already
includes `"24.x"` as one of its three tested Node versions, and
`deploy.yml` already has a dedicated `actions/setup-node@v7` step pinned
to `"24.x"` specifically to run `semantic-release`. Node 24 is already
exercised elsewhere in this repo's own CI — bumping the dev/build floor
to match isn't introducing an untested version.

Revised recommendation: target **Node 24 (Active LTS, EOL 2028-04-30)**
as the floor, not the Vite+ minimum of 20.19+. Concrete changes:

- `action.yml`: `runs.using` → `"node24"`. This is independent of the
  TS7/Vite+/Oxlint/Oxfmt cut-over and time-sensitive — recommend doing it
  as its own immediate PR rather than waiting for this plan's Phase 4,
  since GitHub's Node-20-runner removal date doesn't wait on us finishing
  a tooling migration.
- `package.json`: `engines.node` → `>=24.0.0` (upper bound needs a
  decision — the current `<26.0.0` cap would exclude Node 26 once it
  becomes Active LTS on 2026-10-28; whether to cap at all, and at what,
  isn't something I've verified against Vite+/TS7's tested range, so
  flagging rather than picking a number).
- `.node-version` → `24.x` (or a specific 24.x LTS patch), `volta.node`
  → matching pin. The `.github/actions/setup-node` composite action reads
  `.node-version` (and falls back to `engines.node` via
  `scripts/latest_valid_node_version.sh`) to resolve what version to
  install, so updating these two files is what actually drives CI, not
  just documentation.
- `test.yml` CI matrix: drop the two Node-20 entries (`"20.0.0"`,
  `"20.17.0"`), replace with `24.x` (already present) and, if broader
  coverage is wanted, `22.x` (current Maintenance LTS) — not `20.x` in
  any form.
- `.github/copilot-instructions.md` and `CLAUDE.md`: need "STRICT Node 20.x" replaced with the new floor (a factual correction, Node 20 is EOL, not a style preference, so it should happen regardless of how the rest of the tooling conversion is sequenced). The Biome/esbuild-referencing `.claude/` agent/skill files have the same stale-toolchain problem but are unrelated to the Node-version bump itself — their Biome commands are tracked under §9 Phase 2 (removed in the same phase as `@biomejs/biome` itself), and `PROJECT-CONFIG.md`'s separate `esbuild` declaration under §9 Phase 3 (removed in the same phase as `esbuild` itself).

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
- **Install TypeScript and `oxlint-tsgolint` as a pinned, exact-version
  pair — not `typescript@latest` on its own.** Per §2: `tsgolint`'s
  compatibility is tied to a specific TypeScript patch (its own version
  encodes which one, e.g. `7.0.2000` → TS `7.0.2`), so installing
  `typescript@latest` independently risks drifting past whatever version
  `oxlint-tsgolint` currently targets and silently breaking type-aware
  linting. At execution time (not now, since "today's latest" will be
  stale by then): check `npm view oxlint-tsgolint@7 version` to find the
  current release, decode its embedded TypeScript version from the
  version number, and pin both `typescript` and `oxlint-tsgolint` to that
  exact pair in `package.json` and the lockfile — don't use `@latest` for
  either. `tsc` inside the regular `typescript` package _is_ the native
  compiler post-GA — no `@rc` or `native-preview` package needed.
- **Confirm no consumer of the `typescript` package's programmatic API
  survives before upgrading** (per §2's "no public programmatic compiler
  API" finding) — this is a Phase 0 task, not a Phase 1 surprise.
  `tsc --noEmit` passing proves nothing about whether something else
  imports the TS API directly. §2 already checked: this repo has no
  `typescript-eslint`, `ts-jest`, or `ts-morph`, and the one real
  consumer found — `ts-node` in `devDependencies`, zero invocations
  anywhere in `scripts/` or `.github/` — is **decided dead weight,
  removed in Phase 1 alongside the already-found dead `.babelrc.cjs`**,
  not aliased to `@typescript/typescript6`. Oxlint's `tsgolint` doesn't
  need that compatibility path either, since it vendors its own checker
  rather than calling into this repo's installed `typescript`. Phase 0's
  job here is a final `grep` pass to confirm nothing new showed up since
  §2's check, not to re-litigate the outcome.

## 7. Build (`vite.config.ts`'s `pack` block — tsdown, per §2's verified config surface)

This is a **separate config concern from library "build" in the plain-Vite
sense** — Vite's own `build`/browser-library mode isn't what applies here;
Vite+'s documented `pack` block is specifically "for tsdown," which is
what handles CLI/library npm packaging with declaration generation. Don't
conflate the two when writing the actual config.

Requirements this config must satisfy, carried over from
`scripts/esbuild.mjs` and validated against the existing regression test
(`__tests__/integration-bundled-binary.test.ts`):

1. CLI entry (`src/index.ts`) bundled to a **self-contained** executable at
   `dist/bin/index.js` — `prettier` and all other `dependencies` must be
   **bundled in**, not left external, or the bundled-binary regression
   test fails exactly the way it's designed to catch. **Be explicit about
   this in the tsdown/`pack` config** using tsdown's real `deps`
   namespace (verified directly against
   [tsdown.dev/options/dependencies](https://tsdown.dev/options/dependencies)
   — **not** the deprecated `external`/`noExternal` terms an earlier pass
   of this plan used, and **not** `deps.skipNodeModulesBundle` either,
   which that same page documents as deprecated in favor of
   `deps.neverBundle: true`). **This lives inside the `pack` block of the
   one `vite.config.ts` Phase 2 already created — not a second,
   standalone `defineConfig` imported from `tsdown` directly.** Checked
   [viteplus.dev/config/pack](https://viteplus.dev/config/pack) directly:
   `vp pack` "reads tsdown settings from the `pack` block in
   `vite.config.ts`," using Vite+'s own `defineConfig` (imported from
   `'vite-plus'`, the same import already used for the `fmt`/`lint`/
   `check`/`staged` blocks) — an earlier pass of this plan's code sample
   showed a bare top-level `defineConfig([...])`, which reads as
   replacing that whole file rather than adding to it, discarding
   everything Phase 2 already established. Concretely, tsdown itself
   accepts an **array of per-entry configs** (confirmed via
   [tsdown.dev/options/entry](https://tsdown.dev/options/entry) and this
   session's own web research into tsdown's multi-config support), so
   give the CLI entry its own object with `deps.alwaysBundle` listing (or
   pattern-matching) the runtime `dependencies` that must ship inside
   `dist/bin/index.js`, while the library entry keeps tsdown's default
   (`dependencies`/`peerDependencies`/`optionalDependencies`
   externalized, per the same page) with no `deps` override at all —
   nested under `pack`, alongside the blocks already in the file:
   ```ts
   import { defineConfig } from 'vite-plus';

   export default defineConfig({
     fmt: {/* ...from Phase 2... */},
     lint: {/* ...from Phase 2, including options.typeAware/typeCheck... */},
     check: {/* ...from Phase 2... */},
     staged: {/* ...from Phase 2... */},
     pack: [
       {
         entry: 'src/index.ts',
         platform: 'node',
         outDir: 'dist/bin',
         outExtensions: () => ({ js: '.js' }),
         outputOptions: { codeSplitting: false },
         deps: {
           alwaysBundle: [
             'prettier',
             '@actions/core',
             '@actions/github',
             '@svgdotjs/svg.js',
             'chalk',
             'feather-icons',
             'nconf',
             'svgdom',
             'yaml',
           ],
         },
       }, // CLI
       {
         entry: 'src/index.ts',
         platform: 'node',
         outDir: 'dist/mjs',
         dts: true,
         outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
       }, // library — default externalization, same .js override as the CLI entry, plus dts
     ],
   });
   ```
   **`deps.alwaysBundle` lists every current runtime `dependency`, not just
   `prettier`** — confirmed against `package.json`'s actual `dependencies`
   (9 packages total). A vague `/* ...other runtime deps... */` comment
   isn't a config; whichever of these `package.json` carries at Phase 3
   implementation time is the list this array needs, kept in sync with
   `package.json`'s `dependencies` (not `devDependencies`) at that point
   — `@types/*` entries stay out, they're types-only.
   **Both entries need `outExtensions`, not just the CLI one** — Phase 0's
   spike confirmed (by actually installing tsdown and building a trivial
   config) that its default output extension for `platform: 'node'` is
   `.mjs`, regardless of which entry. Without the override, `vp pack`
   produces `dist/bin/index.mjs` *and* `dist/mjs/index.mjs`. The CLI side
   breaks at the very next step, `chmod +x dist/bin/index.js` (item 5
   below) — `generate-docs` and `action.yml`'s `runs.main` also depend on
   that literal path. The library side breaks silently instead: nothing
   in the build fails, but `package.json`'s `exports.import` and
   `"module"` fields both already say `dist/mjs/index.js`, and Phase 3's
   own text (below) only tells you to remove `require`/`main` — not to
   touch `exports.import`/`"module"` — so ESM consumers of the *published
   npm package* (not just this CLI) end up pointed at a file that
   doesn't exist. Phase 0's spike only got a passing CLI test by manually
   renaming tsdown's `.mjs` output before running it — the actual `pack`
   config must produce the right paths itself, on both entries.

   **This is a choice, not the only correct answer, and it's worth being
   explicit about why**: `package.json` already declares `"type":
   "module"` (verified), so under Node's own module-resolution rules
   `.js` and `.mjs` execute identically in this package — neither
   extension is more "correct" at runtime than the other. The alternative
   fix is retargeting `package.json`'s `exports.import`/`"module"` (and
   `action.yml`'s `runs.main`, for the CLI side) to `.mjs` instead, and
   leaving tsdown's default alone. Forcing `.js` via `outExtensions` is
   preferred here only because it changes one config line per entry
   instead of editing published package metadata and the Action's entry
   point — not because `.mjs` output would be broken or wrong.
   **`outputOptions: { codeSplitting: false }` on the CLI entry is
   required, not optional** — confirmed by Phase 0's spike: Rolldown
   code-splits on `prettier`'s internal dynamic `import()`s for its
   lazily-loaded language plugins, producing 14 separate chunk files
   instead of one. `integration-bundled-binary.test.ts` copies only the
   single entry file into an isolated tempdir with no `node_modules`, so
   a multi-chunk build fails at runtime on missing relative chunk
   imports the moment it's actually tested this way, even though the
   `pack` step itself reports success. Not needed on the library entry —
   default code-splitting is normal, expected behavior for a
   library consumed via `node_modules` resolution, where sibling chunk
   files are just... there.
   **Confirmed, not just inferred**: Vite+'s own `pack`-block example on
   that page shows a single object (`pack: { dts: true, format: [...],
   sourcemap: true }`), not an array, and only says "see tsdown's
   configuration for details" — but Phase 0's spike actually ran a real
   `vp pack` with the array form (via `vite-plus`'s own typed
   `PackUserConfig | PackUserConfig[]` signature) and it built and passed
   `integration-bundled-binary.test.ts` (`docs/phase-0-spike-findings.md`,
   "tsdown `pack`-block bundled-binary test"). The array form is real and
   works; this is no longer an open question. Don't rely on default
   behavior for the CLI entry either way — tsdown's default posture (like most
   npm-library bundlers) is to externalize `dependencies`, which is the
   opposite of what the CLI entry needs. **`outDir: 'dist/bin'` on the
   CLI object is required, not optional** — without it, both entries
   share `entry: 'src/index.ts'` and the CLI output lands wherever
   tsdown's default output directory is, not at `dist/bin/index.js`
   specifically. Item 5's `chmod +x dist/bin/index.js` below,
   `generate-docs`, and `action.yml`'s `runs.main` all execute that exact
   path; an unset `outDir` means the pack step doesn't create the file
   those three steps expect.
   Keep the `alwaysBundle` override scoped to the CLI entry object only.
2. Shebang / ESM interop banner (`#!/usr/bin/env node` + the
   `__filename`/`__dirname`/`require` polyfill shim) preserved via
   Rolldown's `output.banner` (tsdown builds on Rolldown under the hood).
3. Node built-ins (`node:fs`, `node:path`, etc.) stay external regardless
   of the CLI-bundling override above — same as esbuild's `external`
   array did.
4. A single library entry point at `dist/mjs/` (ESM only — no `dist/cjs/`,
   per the decision in §8.1), plus a single declaration file, both
   produced by `vp pack` in one pass instead of the current
   two-`tsc`-invocation dance — but **not** at `dist/types/index.d.ts`.
   Tested directly (`dts: true` on a throwaway library-entry config, no
   `outExtensions` override): tsdown colocates the declaration with its
   JS output and names it `index.d.mts`, not `index.d.ts` — e.g.
   `dist/mjs/index.d.mts`, matching the `.mjs`-vs-`.js` extension problem
   `outExtensions` already solves for the JS file. `OutExtensionObject`
   (tsdown's own type, confirmed by reading
   `node_modules/tsdown/dist/types-*.d.mts`) has a `dts` field alongside
   `js`; adding `dts: '.d.ts'` to the library entry's existing
   `outExtensions` override (alongside `js: '.js'`) and `dts: true` on
   that same entry — confirmed by re-running the test — produces exactly
   `dist/mjs/index.d.ts`. **This is a real, load-bearing change to
   `package.json`, not just a `vp pack` config detail**: `"types"`
   currently declares `dist/types/index.d.ts`; Phase 3 must update it to
   `dist/mjs/index.d.ts` in the same PR that lands this pack config, or
   the package's declared type entry point points at a file that no
   longer exists — the same class of mistake Phase 1's interim fix (§9)
   exists to avoid for the *other* declaration path. No separate
   `dist/types/` output survives Phase 3; that directory was only ever
   the two-`tsc`-invocation approach's path.
5. `chmod +x dist/bin/index.js` — keep as an explicit post-step (or a small
   `vp pack` hook) since neither Rolldown nor tsdown sets the executable
   bit on its own.

## 8. Open decisions requiring your call

These are genuine product/scope decisions, not implementation details —
flagging them rather than silently picking one:

0. **Replace the runtime `prettier` dependency with `oxfmt`'s Node API:
   decided — no, keep `prettier` as a scoped, documented exception.**
   Phase 0's spike ran the actual swap, not just a format-parity check:
   `oxfmt`'s Node API (`format(filename, code, options)`) does produce
   byte-identical output to `formatMarkdown`/`formatYaml` on a real
   generated `README.md`/`action.yml`, and matching `wrapDescription`'s
   `proseWrap: 'always'` output only needed one additional explicit
   option (`printWidth: 80`, since `oxfmt`'s default of 100 differs from
   `prettier`'s default of 80) — so the format-parity question this item
   originally asked **would have resolved in `oxfmt`'s favor**. It
   doesn't matter, because the swap fails on a more fundamental ground
   that supersedes parity entirely: `oxfmt`'s Node API loads a
   platform-specific native `.node` binding via `require()` at runtime,
   resolved from a **separate** `@oxfmt/binding-<platform>`
   optional-dependency package, not embedded in `oxfmt`'s own `dist/`.
   No JS bundler — tested against both the current `esbuild` pipeline and
   a throwaway `tsdown`/Rolldown pack config — can inline a native binary
   that lives in a sibling package resolved at runtime; both produced a
   binary that failed `integration-bundled-binary.test.ts` with
   `Cannot find module './oxfmt.linux-x64-gnu.node'` (full detail:
   `docs/phase-0-spike-findings.md`, "`oxfmt`-swapped bundled-binary test"
   section). **Action: keep `prettier` in `dependencies` as the
   documented exception (§1 already frames this conditionally — update
   it to state this outcome directly), do not add `oxfmt` to
   `dependencies`, and do not touch `src/prettier.ts` in Phase 2 or any
   other phase.** Revisit only if a future `oxfmt` release ships a
   pure-JS/WASM fallback that doesn't require a native binding at
   runtime — until then this isn't a "check again later" item, it's
   closed.

1. **CJS entry point: decided — drop it, ship ESM-only.** Verified two
   things before locking this in: `action.yml`'s `runs:` block
   (`using: "node20"`, `main: "./dist/bin/index.js"`) executes the bundled
   `dist/bin/index.js` binary directly under the Node 20 Action runtime —
   that path never goes through `require`/`main`/`exports.require` at
   all, so the Action's execution is untouched either way. The CLI is the
   same story: it's invoked as a script (`npx`/global bin), not
   `require()`'d as a library. `package.json` already declares
   `"type": "module"`. Combined with §3's finding that `dist/cjs/` isn't
   actually built by anything today, "fix CJS for real" would be adding
   new work to support a consumption mode nothing in this repo currently
   uses or tests. Action: remove the `require` export condition and
   `main` field from `package.json`, keep only the `import` condition and
   `types`, and drop the `dist/cjs` output target from the Vite+/tsdown
   build config in §7 entirely — one library output format (ESM,
   `dist/mjs/`) plus the bundled `dist/bin/` CLI, not two. This is a
   breaking change for any hypothetical `require()` consumer, so it still
   ships as `feat!`/`fix!` per this repo's conventional-commits rules,
   same as any other removed export — but it's not held open pending
   further research the way it was before.

   One correction to the reasoning as originally framed: TypeScript 7's
   native compiler does **not** turn this package's own output into a
   "universal binary." What ships natively is `tsc`/`tsgo` itself — the
   _compiler_ — as a platform-specific binary resolved via npm at install
   time (e.g. a `native-preview-linux-arm64`-style package), used to
   type-check and build faster. It says nothing about how `dist/bin/index.js`
   gets run — that's still a Node-executed ESM script either way. If a
   true standalone executable (no Node runtime required to run _this_
   CLI) is ever wanted, that's Vite+'s separate `vp pack` "standalone app
   binaries" capability (§2) — untested here, and not needed to make the
   ESM-only decision above, which stands on its own from the `action.yml`
   and CLI-invocation evidence.

2. **Oxfmt vs markdownlint overlap on Markdown.** Oxfmt can _format_
   Markdown; markdownlint _lints_ it (prose rules, heading structure,
   etc.) — they're not the same job and can coexist, but running both means
   two tools touching `.md` files. Recommend: let Oxfmt format Markdown
   (replacing Prettier's role there, which `.lintstagedrc` already did),
   keep markdownlint strictly for structural/prose linting, unchanged.
3. **No Biome→Oxlint rule mapping.** Decided: we do **not** try to
   reproduce `biome.json`'s custom rule thresholds
   (`useNamingConvention` per-symbol-kind formats,
   `useFilenamingConvention`, `noExcessiveCognitiveComplexity` @ 25,
   `noExcessiveLinesPerFunction` @ 150, `noBarrelFile`, `noReExportAll`,
   `noDelete`, the `__tests__/**` rule relaxation override, etc.) in
   Oxlint config. `biome.json` is **deleted**, not translated. Oxlint
   is adopted with its own default/recommended rule set as-is. Phase 2's
   job is: turn it on, run it against `src/` and `__tests__/`, and treat
   whatever it reports as real findings to triage — fix the ones that are
   genuine issues, suppress individual false positives inline (with a
   reason comment) if any turn up, and otherwise accept Oxlint's opinion
   of best practice rather than re-deriving Biome's old thresholds. If a
   category of finding turns out to be noisy across the whole codebase
   (not a one-off), that's a config-level call to make at that point,
   from what Oxlint actually flags — not something to pre-decide now by
   guessing at rule-name equivalence.
4. **`vp migrate` vs hand-authored config.** Vite+ ships a `vp migrate`
   command that _preserves_ existing config and _suggests_ removing
   old tooling. That's an incremental-migration tool — it's the opposite
   of what was asked for ("not a migration, a clean cut-over"). Recommend:
   do **not** run `vp migrate`; hand-author `vite.config.ts` from scratch
   in Phase 2 and delete the legacy files in the same commit, per §1.

## 9. Execution phases

Sized to land as reviewable, independently-revertable PRs — "clean
cut-over" describes the _end state_ (no dragged-along legacy config), not
"one giant unreviewable commit."

**Phase 0 — validation spike (no repo changes merged to main config yet)**
Prove the risky parts in isolation on a scratch branch before touching CI:
determine the current compatible `typescript`/`oxlint-tsgolint` pin pair
per §6 and install that (not `@latest`), then run `tsc --noEmit` as-is to
see the real diff of TS7 hard-error deprecations against this codebase.
**`tsc --noEmit` is not enough on its own** — it skips emission entirely,
so it cannot catch failures specific to `postbuild`'s
`tsc --emitDeclarationOnly --outFile dist/types/index.d.ts` invocation
(§3 already flagged this as "an unusual/fragile use of that flag," and
`tsconfig.json`'s current `"ignoreDeprecations": "6.0"` — removed per
§6 — is a real candidate for exactly what's currently suppressing a
warning on it). **Sourcing caveat, stated plainly rather than glossed
over:** the `--outFile`-removal claim itself is backed by secondary
sources (blog/community coverage), not a primary TypeScript changelog
citation I've directly read — that's exactly _why_ this Phase 0 step
exists: an actual empirical run settles it regardless of how precisely
documented the removal is. Actually run `postbuild`'s real declaration-emit command
under the pinned TS7 in this same spike, not just `--noEmit`, so a
Phase 1 build failure shows up here instead of after Phase 1 claims a
green build. **Re-confirm no consumer of the `typescript` programmatic API survives**
per §6/§2 — a final `grep` pass, since `tsc --noEmit` passing doesn't
prove that on its own, and `ts-node` is already decided as dead weight
to remove, not something still being evaluated; hand-write a throwaway
`vite.config.ts` `pack` block (tsdown, per §7 — not a plain-Vite
`build.lib`) and confirm the bundled `dist/bin/index.js` still passes
`integration-bundled-binary.test.ts` unmodified.

**Done — results in `docs/phase-0-spike-findings.md`, decision now closed
per §8.0**: the tsdown pack-block spike above passed (once
`codeSplitting: false` and `outExtensions` are set, per §7). The
`oxfmt`-vs-`prettier` output-parity check also passed on its own terms
(byte-identical, modulo one `printWidth` default difference) — but that
result turned out not to matter, because the bundling question it was
gated behind failed decisively: `oxfmt`'s Node API depends on a native
`.node` binding resolved from a separate optional-dependency package at
runtime, which **no JS bundler can inline**. This was tested both ways
this section originally called for — the throwaway tsdown/Rolldown pack
config, and the actual, current `scripts/esbuild.mjs` pipeline — and both
produced a binary that fails `integration-bundled-binary.test.ts` with
the identical `Cannot find module './oxfmt.linux-x64-gnu.node'` error.
There is no bundler-mismatch risk left to de-risk: `prettier` stays, per
§8.0, and Phase 2 does not touch `src/prettier.ts` at all.

**Phase 1 — TypeScript 7 alone**
Upgrade `typescript` to the pinned compatible version from Phase 0 (not
`@latest` — see §6), fix the `tsconfig.json` per §6 (including dropping
the now-pointless `"ts-node": {"esm": true}` block once `ts-node` itself
is gone), resolve whatever hard-error deprecations Phase 0 surfaced, and
remove `ts-node` from `devDependencies` — decided dead weight (§2/§6),
same treatment as the already-found dead `.babelrc.cjs`, not aliased to
`@typescript/typescript6`. Delete `scripts/editorconfig.ts` and
`scripts/formatter.ts` in the same PR — also dead (§3), and the reason
there's nothing for `ts-node` to have been running in the first place.
Build/lint/format _scripts_ stay textually unchanged **except
`postbuild`, which needs a real replacement, not just a re-confirmation
of Phase 0's finding.** Phase 0's spike confirmed `postbuild`'s
`tsc --emitDeclarationOnly --outFile dist/types/index.d.ts` hard-fails
under TS7 (`TS5102`, `--outFile` removed) and empirically determined the
interim replacement, not just that one is needed: add a dedicated
`tsconfig.build.json` (`extends: "./tsconfig.json"`, `compilerOptions:
{ rootDir: "src" }`, `include: ["src/**/*.ts", "src/**/*.mts"]`) — the
`rootDir` override is required, not optional, or `tsc` hard-fails with
`TS5011` on the restricted `include` — and change `postbuild` to `tsc
--project tsconfig.build.json --emitDeclarationOnly --declaration
--outDir dist/types`. This one config solves three problems at once:
the `TS5102` failure, dev-only declarations (`__tests__/**`,
`__mocks__/node:fs.ts`, `vitest.config.ts`) leaking into the published
`dist/` via the main `tsconfig.json`'s test-inclusive `include`, and the
entry-declaration path — `rootDir: "src"` flattens output so
`index.d.ts` lands directly at `dist/types/index.d.ts`, exactly where
`package.json`'s `"types"` field already points, with no `package.json`
edit needed. Land this in the same PR as the TS7 upgrade — `postbuild`
being deleted and replaced with `vp pack` is Phase 3's job, not Phase
1's, and `npm run build` cannot sit broken for two phases waiting on it.
Smallest possible PR otherwise; isolates TS7 fallout from tooling
fallout.

**Phase 2 — Oxlint + Oxfmt, with Vite+ installed for lint/format/staged
only (build/pack/test blocks NOT touched yet)**
Install `vite-plus` and the pinned `oxlint-tsgolint` (§6) as
`devDependencies`. Author `vite.config.ts` with **only** the `fmt`,
`lint`, `check`, and `staged` blocks (per §2/§4's verified config
surface) — explicitly do not add the `pack` or `test` blocks in this
phase; those are Phase 3's job, and adding them half-configured here
would repeat the exact "referenced but not ready" mistake this
restructuring is fixing. Use Oxlint's own default/recommended rules (no
Biome rule mapping, per §8.3). Run Oxlint against `src/` and `__tests__/`
and triage every finding it surfaces — fix genuine issues, don't
pre-filter them to match what Biome used to allow. **Leave
`src/prettier.ts` and the `prettier` dependency untouched in this phase**
— §8.0's decision, made from Phase 0's spike results, is to keep
`prettier` as a documented runtime exception; there is no `oxfmt` swap
to land here or in any other phase.

**The `lint` block must set `options: { typeAware: true, typeCheck: true
}` explicitly** — confirmed against
[viteplus.dev/guide/lint](https://viteplus.dev/guide/lint), which
documents this as the recommended (not default-on) setting that routes
type checking through `tsgolint`/the TypeScript-Go toolchain so `vp lint`
and `vp check` can catch type errors directly. This isn't optional
polish: `prelint` (`npm run format && tsc --project tsconfig.json
--noemit`) is being folded into `vp check` a few bullets below, which
removes the repo's only other standing type-check gate. Without
`typeAware`/`typeCheck` set on the `lint` block, `vp check` silently
stops catching type errors that `prelint`'s raw `tsc --noEmit` call used
to catch — per
[viteplus.dev/config/check](https://viteplus.dev/config/check), `vp
check`'s own `lint: true`/`fmt: true` toggles only gate whether the format
and lint _steps_ run at all, they don't independently re-enable
type-awareness once it's off in the `lint` block.

This phase must close **every** Biome-invoking surface in the same PR,
not just `push_code_linting.yml` — three were found still calling Biome
directly by review:

- `package.json` scripts: rewrite `format` → `vp fmt`, `format:check` →
  the `vp fmt` check-mode equivalent, `lint:biome`/`lint:biome:fix` →
  `vp lint`/`vp lint --fix`, `check`/`check:fix` → `vp check`/
  `vp check --fix` (confirm exact flag names via `vp fmt --help`/
  `vp lint --help` at execution time rather than assuming), and fold
  `prelint` into `vp check` since that block already does format + lint
  - type-check together. Delete `biome.json`, `.prettierrc.cjs`,
    `.babelrc.cjs` once nothing references them.
- `test.yml`'s `run-tests` job: it runs `biome check ./src/ ./__tests__/`
  directly — **replace with `vp check`, not `vp lint` alone.** Biome's own
  docs describe `check` as running the formatter, linter, and import
  sorting together
  ([biomejs.dev/reference/cli/#biome-check](https://biomejs.dev/reference/cli/#biome-check));
  swapping it for a lint-only step would silently drop the formatting
  gate CI has today. `vp check` is the right one-for-one replacement
  since it already bundles format + lint + type-check (§2/§4), and this
  is the same reason `prelint` folds into it a few bullets above. Land
  this in this same phase, not deferred to Phase 3's build rewrite.
- `push_code_linting.yml`: swap `biomejs/setup-biome` + `biome lint` +
  `mongolyy/reviewdog-action-biome` for **`vp lint --type-aware
--type-check`, not `oxc-project/oxlint-action`.** Checked that action's
  own README directly
  (`raw.githubusercontent.com/oxc-project/oxlint-action/main/README.md`):
  its inputs are `config` (a `.oxlintrc.json` path), `allow`/`warn`/`deny`
  category or rule lists, and `plugins`/`plugins-disable` — nothing in
  that input surface reads `vite.config.ts`, so it would have run a
  second, un-type-aware Oxlint pass with a different rule set than
  `vp lint`/`vp check` use elsewhere in CI. `vp lint --type-aware` is
  itself a documented usage example on
  [viteplus.dev/guide/lint](https://viteplus.dev/guide/lint) (`vp lint`,
  `vp lint --fix`, `vp lint --type-aware`), confirming `vp lint` forwards
  at least that flag straight to the underlying `oxlint` binary, whose
  own `--help` (run directly against this repo) documents both
  `--type-aware` and `--type-check` as real CLI flags equivalent to the
  `options.typeAware`/`typeCheck` settings in `vite.config.ts`'s `lint`
  block. That same page also states outright: "We do not recommend using
  `oxlint.config.ts` or `.oxlintrc.json` with Vite+" — so the
  `.oxlintrc.json`-mirroring fallback an earlier pass of this plan
  proposed here was itself against Vite+'s own guidance, not just an
  unconfirmed detail. Drop `oxc-project/oxlint-action` and
  `mongolyy/reviewdog-action-biome` entirely; run `vp lint --type-aware
--type-check` as a plain step, one config surface (`vite.config.ts`),
  matching `vp check` exactly. **The remaining `--format` question is
  now settled empirically, not deferred**: installed `vp` v0.2.8 in this
  environment via Vite+'s own install script and ran `vp lint --help`
  directly — it lists `-f, --format <FORMAT>` with `github` as one of
  the documented values (`checkstyle`/`default`/`agent`/`github`/
  `gitlab`/`json`/`junit`/`sarif`/`stylish`/`unix`), forwarded straight
  through from `oxlint`. Then ran `vp lint --format github --type-aware
src` against this actual repo: it printed real `::warning
file=...,line=...::...` GitHub Actions annotation syntax, with
  genuinely type-aware findings (`typescript(restrict-template-expressions)`,
  `typescript(no-base-to-string)`, `typescript(await-thenable)`) — proof
  this replaces both what `oxc-project/oxlint-action` did (annotations)
  and what it couldn't do (type-awareness) in one command. The
  `push_code_linting.yml` step becomes `vp lint --format github
--type-aware --type-check`, no third-party action, no
  `oxc-project/oxlint-action` fallback branch needed. Keep the
  markdownlint step as-is.
- **Bootstrap `vp` itself in every workflow job that now calls it**: `vp`
  is a separate global CLI, not the `vite-plus` npm package these jobs'
  `npm install` already pulls in — a job that runs `npm ci` and then
  `vp lint`/`vp check`/`vp fmt` without installing the CLI first just
  fails with "command not found." Add
  [`voidzero-dev/setup-vp`](https://github.com/voidzero-dev/setup-vp) as
  a step before any `vp <command>` call in `test.yml` and
  `push_code_linting.yml` (and in Phase 3's `deploy.yml`/build-step
  changes, once those exist). **Pin an exact release tag at execution
  time, not `@v1`** — the action's own README states the moving `v1`
  major tag "is frozen at v1.15.0 and no longer updated," so a workflow
  using `@v1` silently stops receiving new releases; use the latest
  exact tag (e.g. `@v1.16.1` as of this check, but confirm the current
  latest via the repo's [tags
  page](https://github.com/voidzero-dev/setup-vp/tags) rather than
  hardcoding this plan's number) or a pinned commit SHA, same pinning
  discipline already applied to `typescript`/`oxlint-tsgolint` in §6.
  Per that action's CI guide
  ([viteplus.dev/guide/ci](https://viteplus.dev/guide/ci)), it also
  subsumes `actions/setup-node` and dependency caching for the jobs it
  covers — don't stack a redundant `setup-node` step alongside it in the
  same job. **`test.yml` is the one job where "subsumes `setup-node`"
  needs a qualifier, not a blanket removal**: it runs a 3-way version
  matrix (`node-version: ["24.0.0", "24.19.0", "26.x"]`, confirmed by
  reading the workflow) and feeds each matrix value into
  `./.github/actions/setup-node` via `version: ${{ matrix.node-version
}}`. Dropping that step for a fixed `setup-vp` call with no
  `node-version` input would collapse all three matrix jobs onto
  whatever Node version `setup-vp` or the runner defaults to, silently
  losing the 24.0.0/24.19.0/26.x coverage `test.yml`'s own matrix exists
  to provide. This isn't an inferred fix — `setup-vp`'s own README
  documents `node-version` as a real input (`## Inputs` table: "Node.js
  version to install via `vp env use`") and has a named section, "Matrix
  Testing with Multiple Node.js Versions," showing exactly this pattern
  verbatim: `matrix: { node-version: ["20", "22", "24"] }` feeding
  `with: { node-version: ${{ matrix.node-version }} }`. Apply that same
  pattern to `test.yml` in this one workflow, not to omit the input.
- **`push_code_linting.yml` needs its steps reordered, not just a bootstrap step inserted somewhere in the job.** Read directly: the file's `Run Biome lint` step sits at lines 42-43, while `Install compatible Nodejs version` and `Install Deps: npm install` sit afterward, at lines 45-50. Replacing `Run Biome lint` in place with `vp lint` runs the CLI before Node is even set up, let alone before `vite-plus`/`oxlint-tsgolint`/the `vite.config.ts` this depends on exist. Move the Node-setup, `npm install`, and `setup-vp` steps ahead of the lint step in this job — not after it, which is where they sit today.
- **`setup-vp` only reaches GitHub Actions jobs — it does nothing for
  the two non-workflow callers this phase's own `vp staged` rewrite
  creates.** The `pre-commit` npm script (rewritten above to `vp staged
&& npm run build && npm run generate-docs`) runs via `.husky/pre-commit`
  on every **local** `git commit`, on a developer's own machine, not in
  CI — `setup-vp` never runs there. **Documentation alone doesn't fix
  this** — a line in a contributor guide doesn't stop a checkout that
  hasn't read it from hitting "command not found," so the fix belongs in
  the `prepare` npm script (already runs on every `npm install`,
  currently just the husky-install guard) rather than prose: have
  `prepare` check `command -v vp`, and if it's missing, run Vite+'s own
  install script automatically before continuing — **confirmed
  non-interactive and safe to run unattended**, since I ran it directly
  in this environment (`VP_NODE_MANAGER=no bash install.sh`, sourced
  from `https://viteplus.dev/install.sh`) and it completed cleanly with
  no prompts, installing to `~/.vite-plus` and updating shell rc files.
  This makes `vp`'s presence a consequence of running `npm install` on a
  fresh checkout, not a step a contributor has to remember from a
  document — matching what the comment asked for ("a reproducible
  repository-local CLI installation," not a manual instruction). Keep a
  short note in `.github/copilot-instructions.md`'s setup section too,
  but as a description of what `prepare` already does automatically,
  not as the primary mechanism.
- **The Docker build path has the identical gap and needs its own fix in
  Phase 3**, not just a mention here: `build:docker:default`/
  `build:docker:win32` run `docker run ... node:24-alpine sh -c 'npm run
build'` (confirmed by reading `package.json`) — a bare Node image with
  no `vp` installed, and once Phase 3 makes `build` require `vp pack`,
  this wrapper fails the same way. Phase 3 must update both scripts'
  shell command to install `vp` inside the container before running the
  build, e.g. `sh -c 'curl -fsSL https://viteplus.dev/install.sh | bash
&& npm run build'` (exact invocation to confirm at Phase 3
  implementation time — `node:24-alpine` is Alpine-based and may need
  `curl` installed first via `apk add`, which isn't guaranteed present on
  that base image and hasn't been checked here).
- **Point the `vite`-adjacent dependency surface at Vite+'s core alias**,
  per [viteplus.dev/guide/migrate-rules](https://viteplus.dev/guide/migrate-rules)
  (the reference `vp migrate` itself follows — not run here per §8.4,
  but its documented end-state is still the correct target for a
  hand-authored cut-over): add `@voidzero-dev/vite-plus-core`, pinned to
  the concrete version of the `vite-plus` release actually installed
  (never a `latest` dist-tag) — not a plain `vite` devDependency, since
  this repo has none today and Vite+'s own docs are explicit that the
  alias tracks the installed Vite+ release exactly. This is safe in
  Phase 2 because it's a general Vite+-installation step, not gated on
  the `vitest`/`pack` work below.
  - **`vitest` and `@vitest/coverage-v8` stay untouched in this phase —
    do not remove `vitest` as a direct `devDependency` here.** An
    earlier pass of this plan put that removal in Phase 2, which is
    exactly backwards: `vitest.config.ts` and every `vitest` import in
    `__tests__/**` are explicitly **out of scope for Phase 2** (the
    paragraph right after this list says so) and don't get rewritten to
    `vite-plus/test` until Phase 3. Per migrate-rules' own "When Vitest
    Is Directly Required" section, `vitest` is kept as a package-local
    direct dependency for exactly as long as source/config still
    reference it directly — removing it while those references still
    exist risks Phase 2's required tests resolving a transitive/hoisted
    copy instead of the aligned one, or failing outright. The actual
    removal (plus `@vitest/coverage-v8` version-alignment, `npm ls`
    validation, and lockfile regen) belongs in Phase 3, alongside the
    import rewrite — see that phase below.
- **Only after `vp staged` is actually wired and confirmed working**:
  delete `.lintstagedrc` and the duplicate `lint-staged` block in
  `package.json`, and change the `pre-commit` **npm script**'s body from
  `lint-staged && npm run build && npm run generate-docs` to
  `vp staged && npm run build && npm run generate-docs` — not
  `.husky/pre-commit` itself, which only calls `npm run pre-commit` and
  needs no edit (verified by reading it; see §4). Sequence this last
  within the phase — don't delete the working `lint-staged` setup before
  its replacement is proven, even within the same PR.
- **Remove the replaced tools from `devDependencies`, not just their
  config/invocations**: `@biomejs/biome` and `lint-staged` come out once
  everything above lands. Leaving them installed-but-unused after
  deleting every config file and script that used them isn't a clean
  cut-over, it's dead weight in `package.json` and the lockfile — the
  same standard already applied to `.babelrc.cjs`/`ts-node`.
- **Rewrite every Biome-invoking instruction across every active
  `.claude/` agent/skill file in this same phase, not Phase 4** — confirmed
  by a repo-wide `grep -rli biome .claude/` (excluding worktree scratch
  dirs and the generic `.claude/skills/agent-creator/references/
  agent-examples.md` template, which references Biome only as an
  illustrative example unrelated to this repo's own tooling, not a
  real instruction): `.claude/skills/holistic-linting/PROJECT-CONFIG.md`,
  `.claude/skills/holistic-linting/SKILL.md`, `.claude/agents/
  linting-root-cause-resolver.md`, `.claude/agents/code-review.md`, and
  `.claude/agents/post-linting-architecture-reviewer.md` all repeatedly
  tell agents to run `npx biome check`/`biome format`/`biome lint`, read
  `biome.json` as authoritative, or check Biome-specific rules
  (`noExplicitAny`, `useExplicitType`, etc.) — five files, not two. Once
  `@biomejs/biome` is removed above, those commands invoke a binary
  that's no longer installed; deferring any of them to Phase 4 leaves
  every agent using these files mid-cut-over (Phases 2-3) running a
  broken command. `PROJECT-CONFIG.md`'s separate `esbuild` build-tool
  declaration is a different, unrelated stale reference — that one is
  tied to Phase 3's build migration below, not this phase (see Phase 3).

Explicitly out of scope for Phase 2, staying untouched until Phase 3:
`vitest.config.ts`, `vitest` imports in `__tests__/**` (the
`vite-plus/test` import rewrite belongs to Phase 3, once the `test` block
itself is consolidated — doing it piecemeal here adds churn without
benefit), and the entire build/bundle pipeline.

**Phase 3 — Vite+ build (the big one)**
Add the `pack` block (tsdown, per §7) and `test` block (Vitest) to the
already-present `vite.config.ts`, consolidate `vitest.config.ts` into it,
and rewrite **every direct `vitest` reference repo-wide, not just
`__tests__/**`**. A repo-wide `grep` for `vitest` (not scoped to the test
directory) turns up three more that an earlier pass of this plan missed:
`__mocks__/node:fs.ts` imports `{ vi }` directly from `vitest`,
`tsconfig.json`'s `compilerOptions.types` array includes
`"vitest/globals"`, and `.vscode/launch.json`'s "Debug Current Test File"
launch config hardcodes `"program":
"${workspaceRoot}/node_modules/vitest/vitest.mjs"`. All three need the
same treatment as the `__tests__/**` imports — `__mocks__/node:fs.ts`'s
import rewritten to `vite-plus/test`, `tsconfig.json`'s `types` entry
updated to whatever Vite+'s migration docs specify as the
`vite-plus/test` equivalent for ambient globals, and
`.vscode/launch.json`'s `program` path updated to wherever Vite+ installs
its bundled Vitest binary, if it exposes one at a stable path. **`program`
must name an entry-point file to execute, not a CLI command** — `vp test`
is a command, not a valid `program` value, and VS Code's Node debugger
would just try to execute a nonexistent file called `vp test`. If Vite+
doesn't expose a direct binary path, the correct replacement is
`runtimeExecutable: "npx"` with `runtimeArgs: ["vp", "test", "--", "${fileBasenameNoExtension}"]`
(or whatever Vite+'s actual single-file-run flag turns out to be) and
`program` removed from that config entirely — verify Vite+'s real CLI
surface for running one test file at Phase 3 implementation time before
committing to the exact flag. All three fixes land in this same phase. If Vitest isn't
hoisted as a transitive dependency on a given install (npm doesn't
guarantee hoisting the way pnpm/yarn might), a reference left pointing
at bare `vitest` after the direct `devDependency` is removed below
simply fails to resolve; "rewrite `__tests__/**`" was never the full
scope, it was the scope that happened to get written down.
**Now that every direct reference is actually rewritten, complete the
dependency reconciliation Phase 2 deliberately deferred**: remove `vitest` as a
direct `devDependency` (this repo's Node-only test setup is the "common
node-mode case" `viteplus.dev/guide/migrate-rules` describes, where
`vite-plus` provides it transitively), version-align `@vitest/coverage-v8`
to whatever Vitest version `vite-plus` bundles rather than its own
independent `^4.1.2` range, regenerate `package-lock.json`, and run
`npm ls` to confirm no duplicate/conflicting `vite`/`vitest` resolution
survives — a leftover second copy is exactly the failure mode
migrate-rules' "Vite and Overrides" section warns about.
Replace `scripts/esbuild.mjs` + `tsconfig-mjs.json` +
`scripts/set_package_type.sh` with the `pack` config (ESM-only library
output, no `dist/cjs`, per the decided §8.1; explicit CLI-entry
no-external override per §7), remove the `require` export condition and
`main` field from `package.json`, delete the replaced files, rewrite the
remaining `package.json` build scripts to `vp` commands (`build`
becomes `rimraf dist out && vp pack && chmod +x dist/bin/index.js`, per
the script audit), rewrite `test.yml`'s build step accordingly. **Also
update `.claude/skills/holistic-linting/PROJECT-CONFIG.md`'s `esbuild`
build-tool declaration, and `.github/copilot-instructions.md`'s
esbuild-specific content, in this same phase, not Phase 4** — confirmed
by reading `copilot-instructions.md` directly: it declares "**Build
Tool**: esbuild + TypeScript compiler," describes the
`prebuild`/`build`/`postbuild` pipeline and `dist/cjs/` output this phase
deletes, and lists `scripts/esbuild.mjs` in its project-structure tree.
`esbuild` is the tool this phase directly replaces, so leaving either
file's declaration stale until Phase 4 would misdirect any agent reading
them between this phase landing and Phase 4's PR merging.
`copilot-instructions.md`'s separate stale "ESLint + Prettier" lint-tool
narrative is a different, unrelated staleness (Biome/Oxlint territory,
not esbuild) and stays Phase 4's problem, per below. **Leave
`deploy.yml` calling `npm run build`** — not a direct `vp pack` call
(§4 already corrects this) — and remove the now-replaced
`esbuild`/`esbuild-node-externals` `devDependencies`, same "clean
cut-over deletes the tool, not just its config" standard applied to
Biome in Phase 2 below. **`integration-test.yml` also needs the
`setup-vp` bootstrap step added here**, not left alone: it runs
`npm ci && npm run build` (verified by reading the workflow file), and
once `build` requires `vp pack` to be on `PATH`, this workflow fails
with "command not found" exactly like the CI jobs Phase 2 already
patches, unless it gets the same `voidzero-dev/setup-vp` step. This
phase is gated on Phase 0's spike having already proven the bundled
binary stays self-contained.

**Phase 4 — cleanup**
Update `.github/copilot-instructions.md` and `CLAUDE.md` to describe the
new toolchain instead of the stale ESLint/Prettier narrative, delete this
plan doc's TODOs once landed or fold its "current state" section into
project docs as history. All five `.claude/` files' Biome references and
`PROJECT-CONFIG.md`'s `esbuild` declaration were already rewritten in
Phases 2 and 3 respectively (above) — nothing toolchain-specific remains
for this phase to touch in `.claude/`. (The Node 20 → 24 floor bump and
`action.yml`'s `runs.using` fix, per §5, are recommended as their own
immediate PR _ahead of_ this phase, not bundled into it — see §5.)

Each phase = one PR, green CI required before the next phase starts.
`integration-test.yml`'s **test logic and assertions** are the final gate
every phase must keep passing unmodified — it exercises the built action
end-to-end against real external repos and is the best available signal
that the cut-over hasn't broken actual behavior. Its **environment-setup
step is not exempt from that same unmodified rule's spirit**, though: per
Phase 3 above, once `npm run build` requires `vp` on `PATH`, this
workflow needs the `setup-vp` bootstrap step too, same as every other
job Phase 2/3 already patch — "unmodified" describes the test's
behavior staying the gate, not a license to leave its CI environment
undertooled once the command it runs changes underneath it.

## 10. Risk register

| Risk                                                                                                                                                                                                 | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TS7 hard-errors on patterns Biome/TS6 allowed                                                                                                                                                        | Phase 0 spike surfaces this before any deletion happens                                                                                                                                                                                                                                                                                                                                                                               |
| Rolldown bundling breaks the "fully self-contained binary" guarantee                                                                                                                                 | `integration-bundled-binary.test.ts` already exists and is the exact regression gate; keep it, run it every phase                                                                                                                                                                                                                                                                                                                     |
| Oxlint's default rules differ from Biome's custom thresholds (either direction — some things Biome flagged, Oxlint won't, and vice versa)                                                            | Accepted by design (§8.3) — the goal is Oxlint's own findings against this codebase, not Biome parity; Phase 2 triages whatever Oxlint actually reports rather than pre-tuning config to match the old bar                                                                                                                                                                                                                            |
| Replacing runtime `prettier` with `oxfmt` silently changes generated `README.md`/YAML output for every consumer of this action                                                                       | Closed, not a live risk: Phase 0's spike ran the real-file diff (byte-identical) and the bundled-binary check, and the swap fails on the latter regardless of output parity (native binding unbundlable, per §8.0). `prettier` stays; Phase 2 does not touch `src/prettier.ts`.                                                                                                                                                       |
| `vp` toolchain still "beta" — API/CLI surface can change under us                                                                                                                                    | Pin `vite-plus` (and its bundled Oxlint/Oxfmt/tsdown versions) to exact versions in `package.json`, not ranges, until it reaches stable/1.0                                                                                                                                                                                                                                                                                           |
| Node floor bump to 24 breaks some consumer still pinned to Node 20                                                                                                                                   | Node 20 is already EOL (2026-04-30) and GitHub is removing it from Actions runners entirely in fall 2026, so staying on 20 isn't a neutral fallback to protect — the bump is called out explicitly in the PR description / changelog as a `feat!`/breaking change per this repo's conventional-commits rules, but isn't optional to defer indefinitely                                                                                |
| `semantic-release` / `deploy.yml`'s `git add -f dist` step assumes today's `dist/` layout                                                                                                            | Verify `dist/bin`, `dist/mjs`, `dist/types` paths match after `vp pack` (no `dist/cjs` — dropped per §8.1), update the force-add + `files` array in `package.json` if paths shift                                                                                                                                                                                                                                                     |
| Dropping the `require`/`main` export is a breaking change for any unseen `require()` consumer of this package as a library (vs. as an Action/CLI)                                                    | Called out explicitly as `feat!`/`fix!` in the PR description and changelog per this repo's conventional-commits rules, same as the Node-floor bump                                                                                                                                                                                                                                                                                   |
| TS7 GA has no public programmatic compiler API — a hidden tool importing `typescript` directly could break silently even though `tsc --noEmit` passes                                                | Checked which of this repo's actual dependencies would be exposed (§2): none of `typescript-eslint`/`ts-jest`/`ts-morph` are present, and the one real hit (`ts-node`) is decided dead weight, removed in Phase 1 rather than upgraded-and-hoped. Oxlint's `tsgolint` isn't exposed either (vendors its own checker). Phase 0 re-confirms nothing new appeared before Phase 1 deletes it — low residual risk, not an open contingency |
| `typescript` and `oxlint-tsgolint` installed independently (e.g. both `@latest`) drift out of the exact-version compatibility `tsgolint` requires, silently degrading or breaking type-aware linting | §6: pin both to the exact compatible pair at execution time (decoded from `oxlint-tsgolint`'s own version scheme), not installed via `@latest` separately                                                                                                                                                                                                                                                                             |

## 11. Rollback

Each phase lands as its own PR against a real base branch with CI green
before merge, so rollback is `git revert` of that phase's merge commit —
no phase depends on hand-edits outside its own PR, so reverting Phase 3
doesn't require also reverting Phase 1/2.

## 12. Sources

Every external claim in this plan traces to one of these — consolidated
here since inline citations were only ever consistently present in §2's
table until this pass. Grouped by confidence, not by topic: primary
sources I fetched or read directly, versus secondary coverage used
where I didn't independently confirm against a primary source.

**Primary (fetched/read directly during this plan's research):**

- [TypeScript 7.0 GA announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) — official Microsoft devblog. Backs: TS7 GA date, native-compiler claim, no-programmatic-API finding, `@typescript/typescript6` compatibility shim.
- [`typescript` package on npm](https://www.npmjs.com/package/typescript) / npm registry data for `typescript@7.0.2` and `@typescript/native-preview` — fetched directly (`registry.npmjs.org`). Backs: `bin.tsc`, per-platform `optionalDependencies`, the GA-vs-nightly distinction.
- [Oxc blog — Type-Aware Linting Stable](https://oxc.rs/blog/2026-07-22-type-aware-linting-stable) — fetched directly. Backs: `tsgolint` stability date, rule-coverage numbers, the `<TS version><patch>` versioning scheme that drives the exact-pin requirement (§6).
- [Oxfmt Beta announcement](https://oxc.rs/blog/2026-02-24-oxfmt-beta) and [Oxfmt Quickstart](https://oxc.rs/docs/guide/usage/formatter/quickstart.html) — fetched directly. Backs: Oxfmt's Prettier-conformance claim, its Node.js API shape.
- [Vite+ Beta announcement](https://voidzero.dev/posts/announcing-vite-plus-beta), [viteplus.dev/config/](https://viteplus.dev/config/), [viteplus.dev/guide/commit-hooks](https://viteplus.dev/guide/commit-hooks), [viteplus.dev/guide/migrate](https://viteplus.dev/guide/migrate) — all fetched directly. Backs: the entire `fmt`/`lint`/`check`/`test`/`pack`/`staged` block list (§2/§4), `vp staged` (not `vp check --staged`), the `vite-plus/test` import rewrite.
- [nodejs.org/dist/index.json](https://nodejs.org/dist/index.json) — fetched directly. Backs: the Node 20/22/24/26 LTS-status table in §5, cross-checked against each release's own `lts` field rather than a secondary summary.
- [Node.js docs — Modules: TypeScript](https://nodejs.org/api/typescript.html) — official Node.js docs. Backs: native type-stripping as the real "replacement" for `ts-node` (§3).
- [GitHub Changelog — Deprecation of Node 20 on GitHub Actions runners](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/) — official GitHub changelog. Backs: the hard deadline forcing `action.yml`'s `runs.using` off `node20` (§5).
- [tsdown.dev/options/dependencies](https://tsdown.dev/options/dependencies) — fetched directly. Backs: §7's `deps.neverBundle`/`deps.alwaysBundle` config surface, the array-of-configs per-entry pattern, and `deps.skipNodeModulesBundle`'s deprecated status (superseded by `deps.neverBundle: true`).
- [viteplus.dev/guide/lint](https://viteplus.dev/guide/lint) and [viteplus.dev/config/check](https://viteplus.dev/config/check) — fetched directly. Back §9 Phase 2's `lint.options.typeAware`/`typeCheck` requirement and how `vp check`'s own `fmt`/`lint` toggles do (and don't) interact with it.
- [viteplus.dev/guide/migrate-rules](https://viteplus.dev/guide/migrate-rules) — fetched directly. Backs §9 Phase 2's `vite`-core-alias/`vitest`/`@vitest/coverage-v8` dependency-reconciliation steps (the "common node-mode case" removal rule, the pinned-to-installed-release alias, the `npm ls`-verification concern).
- [viteplus.dev/guide/ci](https://viteplus.dev/guide/ci) and [github.com/voidzero-dev/setup-vp](https://github.com/voidzero-dev/setup-vp) (README, fetched directly) — back §9 Phase 2's `setup-vp` CI-bootstrap requirement, the exact-tag-pin correction (the action's own README states its `@v1` moving tag is frozen at `v1.15.0` and receives no further releases), the `## Inputs` table entry for `node-version`, and that same README's own "Matrix Testing with Multiple Node.js Versions" section — backing the `node-version: ${{ matrix.node-version }}` fix for `test.yml` with the action's own documented example, not an inferred equivalence to `setup-node`.
- `git log`/`gh pr view` against this repo directly (not a claim about external tooling, but the same verify-before-writing discipline) — confirmed PR #616 (Docker image + lockfile `engines` fix) is merged to `main`, and that this plan branch's own working tree only reflected that fix after rebasing onto `main` — the resolution for the Docker-row finding below.
- [biomejs.dev/reference/cli/#biome-check](https://biomejs.dev/reference/cli/#biome-check) — official Biome docs. Backs §9 Phase 2's correction that `biome check` covers formatting + linting + import sorting together, so its CI replacement must be `vp check`, not `vp lint` alone.
- [`oxc-project/oxlint-action` README](https://raw.githubusercontent.com/oxc-project/oxlint-action/main/README.md) — fetched directly. Backs §9 Phase 2's finding that this action's input surface (`config`/`allow`/`warn`/`deny`/`plugins`) never reads `vite.config.ts`, so it can't pick up `typeAware`/`typeCheck`.
- `oxlint --help` and `oxlint --init` (both run directly against this repo), plus the `configuration_schema.json` file the installed `oxlint` package ships (read directly) — back §9 Phase 2's `--type-aware`/`--type-check` CLI flags, and confirm these are the exact CLI/`.oxlintrc.json` equivalents of `vite.config.ts`'s `lint.options.typeAware`/`typeCheck`. [viteplus.dev/guide/lint](https://viteplus.dev/guide/lint) — fetched directly — backs `vp lint --type-aware` as a documented usage example and the explicit "we do not recommend `.oxlintrc.json` with Vite+" statement.
- `grep`/`Read` against this repo directly — confirmed `__mocks__/node:fs.ts` imports `vitest` and `tsconfig.json`'s `compilerOptions.types` includes `"vitest/globals"`, both outside `__tests__/**`; and `.vscode/launch.json`'s "Debug Current Test File" launcher, which hardcodes `program: '${workspaceRoot}/node_modules/vitest/vitest.mjs'` — confirmed by reading the file directly. All three need the same treatment: rewritten to point at wherever `vite-plus` actually resolves post-migration (confirm the correct debug entry point at Phase 3 implementation time rather than assuming `node_modules/vitest/vitest.mjs` still resolves). Also confirmed `package.json`'s `pre-commit` script runs via `.husky/pre-commit` on local commits (not CI) and `build:docker:default`/`build:docker:win32` run inside a bare `node:24-alpine` container; confirmed `test.yml`'s `matrix.node-version` (`["24.0.0", "24.19.0", "26.x"]`) feeds `./.github/actions/setup-node` via `version: ${{ matrix.node-version }}`. Backs §9 Phase 3's expanded vitest-rewrite scope, the local/Docker `vp`-bootstrap gap, and the `setup-vp` matrix-parameterization fix.
- **`vp` v0.2.8 installed and run directly in this session** (`curl -fsSL https://viteplus.dev/install.sh`, executed non-interactively via `VP_NODE_MANAGER=no bash`) — not documentation, an actual empirical run. `vp lint --help` confirmed `-f, --format <FORMAT>` including a `github` value; `vp lint --format github --type-aware src` against this repo's real `src/` produced genuine `::warning file=...::...` annotations with type-aware findings (`restrict-template-expressions`, `no-base-to-string`, `await-thenable`), fully resolving §9 Phase 2's previously-open annotation-format question. `vp test __tests__/helpers.test.ts` ran Vitest 4.1.10 and passed all 42 tests, confirming `test` → `vp test`. `vp test --coverage __tests__/helpers.test.ts` reproduced `Cannot find package '@vitest/coverage-v8'` (resolved against `vite-plus`'s bundled Vitest 4.1.10, not this repo's independently-pinned `^4.1.2`), direct empirical confirmation that §9 Phase 3's `@vitest/coverage-v8` version-alignment requirement is load-bearing, not precautionary.
- [`setup-vp` README](https://raw.githubusercontent.com/voidzero-dev/setup-vp/main/README.md) — fetched directly (same fetch as the CI-bootstrap citation above). Backs the `curl -fsSL https://viteplus.dev/install.sh | bash` / `irm https://viteplus.dev/install.ps1 | iex` local-install commands used in §9 Phase 2's local-caller fix — sourced from that README's own "Development" section, not verified as the general end-user installation path, and the `node:24-alpine`/`curl`-availability question for the Docker fix is explicitly left unverified (no Docker daemon available in this session to test empirically).
- `grep`/`Read` against this repo directly — confirmed `.vscode/launch.json`'s hardcoded `vitest.mjs` path (Phase 3); `.claude/skills/holistic-linting/PROJECT-CONFIG.md`, `.claude/skills/holistic-linting/SKILL.md`, `.claude/agents/linting-root-cause-resolver.md`, `.claude/agents/code-review.md`, and `.claude/agents/post-linting-architecture-reviewer.md`'s direct Biome references (Phase 2); and `PROJECT-CONFIG.md`'s separate `esbuild` reference (Phase 3). Backs §9 Phase 2/3's expanded cleanup scope.

**Secondary (search-result coverage, not independently confirmed against a primary source):**

- The `--outFile` compiler-option removal claim (§3, §9 Phase 0) — sourced from blog/community coverage (NestJS GitHub issue discussion, general TS6/7 migration blogs), not a TypeScript release-notes page I've read directly. Flagged inline where it's used, not just here — this is exactly why Phase 0 now runs the real declaration-emit command instead of trusting the claim.
- General TS7 ecosystem-breakage coverage (`typescript-eslint`/`ts-jest`/`ts-morph`/framework template-checkers not working on TS7) — corroborated across multiple independent blog/news sources during research, consistent with the primary GA announcement's own statement that the programmatic API is gone until 7.1, but the specific list of affected tools is secondary-sourced.
- Node 24 type-stripping's exact stabilization version (v24.12.0) — from secondary coverage (dev.to, ishu.dev) cross-referenced against the primary `nodejs.org/api/typescript.html` page, which confirms the capability but wasn't re-checked here for the exact version number the secondary sources cite.
