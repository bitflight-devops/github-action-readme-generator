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
needs a source-only `include`/`exclude` (either a dedicated
`tsconfig.build.json` scoped to `src/**`, or excluding `__tests__`,
`__mocks__`, and `vitest.config.ts` from the declaration-emit invocation
specifically, without changing the main `tsconfig.json`'s test-inclusive
`include` that `vitest`/editor tooling relies on) in addition to the
`outDir`-path/`"types"`-field fix above** — not `--outDir` plus a
`"types"` update alone.

## Repo state note

`main`'s current HEAD (`ccf91c2`) has `dist/` **tracked** — it's the release
snapshot force-added by `deploy.yml`'s `git add -f dist` step during the most
recent release, exactly as `docs/typescript-7-vite-plus-conversion-plan.md`
§3/§4 already documents. Running `rm -rf dist` on a checkout of this
specific commit deletes tracked files, not gitignored build output — learned
this by doing it and needing `git checkout -- dist` to restore. Worth a
one-line callout anywhere the plan tells a future implementer to
`rm -rf dist` on a branch cut from a post-release `main`.

## Remaining Phase 0 work (not yet run)

- Hand-write a throwaway `vite.config.ts` `pack` block (tsdown) and confirm
  the bundled `dist/bin/index.js` still passes
  `integration-bundled-binary.test.ts`.
- Run `oxfmt`'s Node API against a real generated `README.md`/`action.yml`
  and diff against today's `prettier` output (§8.0).
- Build a throwaway bundled binary with `src/prettier.ts` swapped onto
  `oxfmt`'s API and confirm it still passes
  `integration-bundled-binary.test.ts` — both via the throwaway tsdown pack
  block and via the real, currently-in-use `scripts/esbuild.mjs` pipeline
  (per the plan's §9 Phase 0 fix distinguishing the two).
