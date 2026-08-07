# Phase 0 validation spike — findings

Empirical results from running the actual tools against this repo, on a
scratch branch (`phase0/vite-plus-validation-spike`, off `main` at `ccf91c2`).
Per `AGENTS.md`'s process: these are direct command output, not inference from
documentation. Companion to
`docs/typescript-7-vite-plus-conversion-plan.md`'s §9 Phase 0.

## TypeScript 7 / `oxlint-tsgolint` pin pair

Checked `npm view typescript dist-tags` and `npm view oxlint-tsgolint
dist-tags` directly against the npm registry:

- `typescript@latest` = `7.0.2` (the only non-RC, non-`7.1.0-dev.*` release
  in the `7.x` line as of this check).
- `oxlint-tsgolint@latest` = `7.0.2001` — matches the documented
  `<TS version><patch>` scheme (TS `7.0.2`, tsgolint patch `1`).

**Current correct pin pair: `typescript@7.0.2` + `oxlint-tsgolint@7.0.2001`.**
Both happen to be `latest` right now, but per the plan's own guidance this
should be checked again at Phase 1/2 implementation time, not assumed to
still be `latest` — a `typescript@7.1` promotion to `latest` before
`oxlint-tsgolint` publishes a matching patch would break this pairing if
`@latest` is used literally instead of the confirmed exact versions.

## `tsc --noEmit` under TS7.0.2

Installed `typescript@7.0.2` (`npm install --no-save`) and ran:

```bash
npx tsc --project tsconfig.json --noEmit
```

**Result: clean pass, zero errors, exit code 0.** This repo's `tsconfig.json`
and source have no hard-error deprecations under real TS7 — the concern in
§9 Phase 0 about surfacing `tsc --noEmit` fallout didn't materialize.

## `postbuild`'s `--outFile` invocation

Ran the actual `postbuild` declaration-emit command:

```bash
npx tsc --project tsconfig.json --emitDeclarationOnly --declaration --outFile dist/types/index.d.ts
```

**Result: hard failure.**

```text
tsconfig.json(3,3): error TS5102: Option 'outFile' has been removed. Please remove it from your configuration.
```

Exit code 2. This **confirms** the plan's previously secondary-sourced
`--outFile`-removal claim with a primary result: a real compiler error code
from the actual pinned TS7 release, not blog/community coverage. Phase 1's
conditional interim-fix commitment (§9) is not hypothetical — it is required.

## Testing the proposed interim fix: drop `--outFile`, use `--outDir`

```bash
npx tsc --project tsconfig.json --emitDeclarationOnly --declaration --outDir dist/types
```

**Result: succeeds, exit code 0.** Emits 42 per-file `.d.ts` files mirroring
`src/`'s structure (e.g. `dist/types/src/helpers.d.ts`,
`dist/types/src/sections/index.d.ts`, ...).

**New finding, not previously called out in the plan:** the entry-point
declaration lands at `dist/types/src/index.d.ts` (mirroring `src/index.ts`),
**not** `dist/types/index.d.ts` — the exact path `package.json`'s `"types"`
field currently declares. Dropping `--outFile` for `--outDir` without also
updating `"types"` in `package.json` leaves the package's declared type
entry point pointing at a file that no longer exists. **Phase 1's interim
fix must update `package.json`'s `"types"` field to
`dist/types/src/index.d.ts` in the same change**, or restructure the `tsc`
invocation (e.g. a `rootDir`/output-flattening option) to land the entry
file at the currently-declared path instead. This is a concrete, missing
step to fold into §9 Phase 1 / the `postbuild` script-audit row.

**Second finding (Codex review on this doc, confirmed by re-running the
command and counting output): the `--outDir` command as written is not a
complete interim fix on its own.** `tsconfig.json`'s `"include"` is
`["**/*.ts", "**/*.mts"]` with no exclusion for `__tests__`, `__mocks__`,
or `vitest.config.ts`, so the same command that produces the 26 `src/`
declarations above also emits 16 dev-only declarations alongside them:
one from `__mocks__/node:fs.ts`, fourteen from `__tests__/**`, and
`vitest.config.d.ts`. `package.json`'s `"files"` field publishes all of
`dist/` unfiltered, so adopting `--outDir` exactly as tested would ship
all 16 dev-only `.d.ts` files in the published package. **The interim fix
needs a source-only `include`/`exclude`** (a dedicated
`tsconfig.build.json` scoped to `src/**`, without changing the main
`tsconfig.json`'s test-inclusive `include` that `vitest`/editor tooling
relies on) **in addition to** the `outDir`-path fix above.

**Third finding (Codex review, confirmed empirically by actually running
it): a source-only `include` needs an explicit `rootDir` too, or it hard-fails.**
Tested a dedicated config (`extends` the base `tsconfig.json`, `include:
["src/**/*.ts", "src/**/*.mts"]`, no `rootDir` override) with the same
`--emitDeclarationOnly --declaration --outDir` invocation:

```text
error TS5011: The common source directory of 'tsconfig.build-test-norootdir.json' is './src'. The 'rootDir' setting must be explicitly set to this or another path to adjust your output's file layout.
```

Exit code 2 — confirmed. Re-ran with `compilerOptions.rootDir: "src"`
added: **exit code 0**, and the emitted files land flattened directly at
the `outDir` root (e.g. `Action.d.ts`, `config.d.ts`, `errors/is-error.d.ts`)
with no `src/` prefix — meaning the entry declaration lands at exactly
`dist/types/index.d.ts`, the path `package.json`'s `"types"` field already
declares. **This supersedes the "update `"types"` to
`dist/types/src/index.d.ts`" alternative floated in the first finding
above**: a dedicated `tsconfig.build.json` with `include: ["src/**"]` and
`rootDir: "src"` solves all three problems in one config — the `TS5102`
`--outFile` removal, the dev-file leakage, and the entry-path mismatch —
with zero `package.json` changes required. **Recommended Phase 1 interim
fix, superseding the split recommendation above**: add
`tsconfig.build.json` (`extends: "./tsconfig.json"`, `compilerOptions:
{rootDir: "src"}`, `include: ["src/**/*.ts", "src/**/*.mts"]`), and change
`postbuild` to `tsc --project tsconfig.build.json --emitDeclarationOnly
--declaration --outDir dist/types`.

## Repo state note

`main`'s current HEAD (`ccf91c2`) has `dist/` **tracked** — it's the release
snapshot force-added by `deploy.yml`'s `git add -f dist` step during the most
recent release, exactly as `docs/typescript-7-vite-plus-conversion-plan.md`
§3/§4 already documents. Running `rm -rf dist` on a checkout of this
specific commit deletes tracked files, not gitignored build output — learned
this by doing it and needing `git checkout -- dist` to restore. Worth a
one-line callout anywhere the plan tells a future implementer to
`rm -rf dist` on a branch cut from a post-release `main`.

## tsdown `pack`-block bundled-binary test

Wrote a throwaway `vite.config.ts` using `vite-plus`'s own `defineConfig`
with a `pack` block (per §7), targeting the same CLI entry as the real
build. **Confirms §7's open question**: `vite-plus`'s own
`dist/define-config-*.d.ts` types `pack?: PackUserConfig | PackUserConfig[]`
— the array form is real and typed, not just inferred from tsdown's own
multi-config support.

First build attempt produced **14 separate chunk files**, not one — Rolldown
code-splits on Prettier's internal dynamic `import()`s for its lazily-loaded
language plugins (babel/typescript/flow/postcss/html/markdown/yaml/graphql/
angular/acorn/meriyah/glimmer parsers). `integration-bundled-binary.test.ts`
copies only a single file into an isolated tempdir, so this would fail at
runtime on missing relative chunk imports. **Fix**: add
`outputOptions: { codeSplitting: false }` to the pack entry (`tsdown`/
Rolldown's replacement for the deprecated `inlineDynamicImports`). Rebuild
produced one 8.62MB `index.mjs`, matching esbuild's current single-file
behavior.

Copied that file to `dist/bin/index.js` and ran
`npx vitest run __tests__/integration-bundled-binary.test.ts`:
**both tests pass, exit 0.** The tsdown-built binary satisfies the existing
bundled-binary regression test unmodified, once `codeSplitting: false` is
set. **This is a required addition to §7's `pack` config, not optional** —
without it, Phase 3's build silently produces a broken multi-file binary.

## `oxfmt` Node API vs. `prettier` output diff (§8.0)

`oxfmt` is a standalone npm package (`oxfmt@0.62.0`, also bundled as an
optional binary of `vite-plus@0.2.8`) with a real Node API — no CLI
fallback needed: `format(fileName, sourceText, options?):
Promise<{code, errors}>`, parser selected from the filename extension. Its
`FormatConfig` includes `semi`, `embeddedLanguageFormatting`, and
`proseWrap` — the same options `src/prettier.ts` passes to Prettier.

Ran the repo's actual compiled `formatMarkdown`/`formatYaml` (from
`dist/mjs/prettier.js`) against a real, freshly-generated `README.md`/
`action.yml` (via `npm run generate-docs`), and `oxfmt.format()` with
equivalent options against the same content.

**Result: byte-for-byte identical for both files** (`diff` empty, MD5
checksums match, zero `oxfmt` errors). Neither call site sets `proseWrap`
(both default to `"preserve"`), so no line-rewrapping occurs.

**New finding: `wrapDescription`'s `proseWrap: 'always'` path diverges by
default.** Testing a long description string through both formatters with
`{semi: false, proseWrap: 'always'}` (as `wrapDescription` calls it, no
explicit `printWidth`) produced different wraps — Prettier's default
`printWidth` is 80, `oxfmt`'s is 100. Forcing `printWidth: 80` explicitly
on the `oxfmt` call made the outputs byte-identical again, confirming the
*only* divergence is the default width, not any other formatting rule.
**An `oxfmt` swap must add `printWidth: 80` explicitly to the
`wrapDescription` call site** to preserve current output.

## `oxfmt`-swapped bundled-binary test — swap is not viable with either bundler

Swapped `src/prettier.ts`'s three exports onto `oxfmt`'s API (same
input/output contract) and tested the bundled binary two ways, per §9
Phase 0's distinction between the current esbuild pipeline and Phase 3's
future tsdown pipeline:

- **Real `scripts/esbuild.mjs` pipeline: fails to even bundle.** `esbuild`
  hard-errors on 7 unresolved dynamic `import()`s inside `oxfmt`'s bundle —
  optional Prettier-compat plugins (`@prettier/plugin-oxc`, `-hermes`,
  `-pug`, `prettier-plugin-astro`, `-marko`, `@zackad/prettier-plugin-twig`,
  `@shopify/prettier-plugin-liquid`) it lazy-loads for niche languages, none
  installed. Externalizing those 7 lets bundling succeed, but the test then
  fails: `Cannot find module '@oxfmt/binding-linux-x64-gnu'`.
- **Throwaway tsdown pack pipeline: bundles, but fails the same test.**
  Rolldown treats the same 7 imports as warnings, not hard errors, so the
  build itself succeeds (after also adding `outExtensions` for `.js` output
  and `inlineDynamicImports: true`/`codeSplitting: false` for a single
  file) — but the resulting binary fails
  `integration-bundled-binary.test.ts` with the **identical**
  `Cannot find module './oxfmt.linux-x64-gnu.node'` error.

**Root cause, same for both bundlers**: `oxfmt`'s Node API loads a
platform-specific native N-API `.node` binding at runtime via `require()`,
resolved from a **separate** `@oxfmt/binding-<platform>` optional-dependency
package — not embedded in `oxfmt`'s own `dist/`. No JS bundler (esbuild or
Rolldown/tsdown) can inline a native binary that lives in a sibling
package resolved at runtime; it's simply absent once only the bundled
`dist/` is copied into the `node_modules`-less isolated test directory the
integration test runs in.

**Conclusion, overriding §8.0's open question**: this is not a bundler-
config gap fixable with more `deps.alwaysBundle`/`external` tuning — it's
structural. **Recommend keeping `prettier` as the documented
`dependencies` exception (per §8.0) rather than pursuing the `oxfmt` swap**,
unless `oxfmt` ships a pure-JS/WASM fallback in a future release that
doesn't require a native binding at runtime.
