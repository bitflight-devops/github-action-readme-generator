import { defineConfig } from "vite-plus";

// Phase 3 of docs/typescript-7-vite-plus-conversion-plan.md added the `pack`
// and `test` blocks below to the `fmt`/`lint`/`check`/`staged` blocks Phase 2
// already established.
const config: ReturnType<typeof defineConfig> = defineConfig({
  lint: {
    // Type-aware/type-check both required explicitly (not default-on) so
    // `vp check` keeps the type-check coverage `prelint`'s raw `tsc --noEmit`
    // used to provide. See §9 Phase 2.
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        // typescript/unbound-method: investigated individually across all 26
        // sites it flagged in __tests__/** (2026-08-09). Every site is one of
        // three sub-patterns of the same vitest-mock idiom:
        //   expect(obj.mockMethod).toHaveBeenCalledWith(...) / .toBeCalled()
        //   expect(vi.isMockFunction(obj.mockMethod)).toBe(true)
        //   vi.mocked(obj.mockMethod).mockReturnValue(...)/.mockImplementation(...)
        // In each, the method reference is only read (call-history/identity
        // introspection) or reconfigured for a later call vitest itself makes
        // through the real receiver — never detached into a bare variable and
        // invoked without its receiver, which is the actual bug this rule
        // guards against. 14 of the 26 are the identical line repeated in
        // __tests__/update-contents.test.ts, so per-site inline suppressions
        // would be pure noise. Zero exceptions found; see AGENTS.md-adjacent
        // investigation notes in the PR description for the full site list.
        files: ["__tests__/**"],
        rules: { "typescript/unbound-method": "off" },
      },
    ],
  },

  // Matches the repo's pre-existing (Biome-era) style, so adopting Oxfmt
  // doesn't cause a mass reformat of already-conforming code.
  fmt: {
    singleQuote: true,
    semi: true,
    printWidth: 100,
    trailingComma: "all",
  },

  staged: {
    "{src,__tests__}/**/*.ts": "vp check --fix",
    // Oxfmt formats Markdown/YAML; markdownlint keeps doing prose/structure
    // linting separately (§8.2). No Oxfmt equivalent exists for shell
    // scripts or package.json, so neither is reformatted on commit anymore.
    "*.{md,yaml,yml}": "vp fmt --write",
  },

  // §7: replaces scripts/esbuild.mjs + tsconfig-mjs.json +
  // scripts/set_package_type.sh + tsconfig.build.json. Two entries sharing
  // the same source: a self-contained CLI binary and an ESM library build.
  pack: [
    {
      // CLI (`dist/bin/index.js`) — must stay a single, self-contained file:
      // integration-bundled-binary.test.ts copies only this file into an
      // isolated tempdir with no node_modules, so every runtime `dependency`
      // has to be bundled in, not left external.
      entry: "src/index.ts",
      platform: "node",
      outDir: "dist/bin",
      // tsdown auto-enables declaration output repo-wide because
      // package.json's "types" field is set (needed for the library entry
      // below) — turn it off here so the CLI binary doesn't also get a
      // stray, unused dist/bin/index.d.ts.
      dts: false,
      // tsdown defaults to `.mjs` for platform: 'node'; force `.js` to match
      // package.json's "type": "module" (both execute identically under
      // Node's ESM rules) and the paths generate-docs/action.yml/chmod
      // already depend on.
      outExtensions: () => ({ js: ".js" }),
      // Rolldown code-splits on prettier's internal dynamic imports by
      // default, producing multiple chunk files — fatal for a single-file
      // bundled binary with no node_modules to resolve sibling chunks from.
      outputOptions: { codeSplitting: false },
      // Preserves the shebang + __filename/__dirname/require ESM-interop
      // shim scripts/esbuild.mjs's banner used to inject.
      banner: `#!/usr/bin/env node

await(async()=>{let{dirname:e}=await import("path"),{fileURLToPath:i}=await import("url");if(typeof globalThis.__filename>"u"&&(globalThis.__filename=i(import.meta.url)),typeof globalThis.__dirname>"u"&&(globalThis.__dirname=e(globalThis.__filename)),typeof globalThis.require>"u"){let{default:a}=await import("module");globalThis.require=a.createRequire(import.meta.url)}})();
`,
      deps: {
        // Every runtime `dependency` in package.json, excluding the two
        // types-only entries (@types/feather-icons, @types/svgdom) that have
        // no runtime code to bundle.
        alwaysBundle: [
          "@actions/core",
          "@actions/github",
          "@svgdotjs/svg.js",
          "chalk",
          "feather-icons",
          "nconf",
          "prettier",
          "svgdom",
          "yaml",
        ],
        // alwaysBundle above only lists the top-level packages; tsdown also
        // pulls in their transitive node_modules dependencies (@octokit/*,
        // undici, etc.) to keep the binary self-contained, which is the
        // whole point (see the entry's own comment above) - not something to
        // whitelist package-by-package via onlyBundle, which would just
        // break on the next transitive-dependency bump.
        onlyBundle: false,
      },
    },
    {
      // Library (`dist/mjs/`) — ESM-only, per §8.1 (no `dist/cjs`). Default
      // externalization (dependencies/peerDependencies/optionalDependencies)
      // applies; no `deps` override needed.
      entry: "src/index.ts",
      platform: "node",
      outDir: "dist/mjs",
      dts: true,
      // Same .js override as the CLI entry, plus .d.ts (tsdown otherwise
      // colocates declarations as .d.mts) — package.json's "types" field
      // points at dist/mjs/index.d.ts.
      outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
    },
  ],

  // Consolidated from vitest.config.ts (Phase 3 — Vite+ bundles Vitest
  // rather than replacing it).
  test: {
    globals: true,
    setupFiles: ["dotenv/config"],
    environment: "node",
    root: "./",
    include: ["__tests__/**/*.test.ts"],
    deps: {
      interopDefault: true,
    },
    coverage: {
      provider: "v8",
      reportsDirectory: "./out",
      reporter: ["text", "json-summary", "json"],
      include: ["src/"],
    },
  },
});

export default config;
