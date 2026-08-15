import { defineConfig } from "vite-plus";

const config: ReturnType<typeof defineConfig> = defineConfig({
  lint: {
    // Type-aware/type-check are both off by default, and `vp check` is CI's
    // gate — without these two, nothing in CI type-checks.
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        // typescript/unbound-method fires on the vitest-mock idiom, in three
        // shapes:
        //   expect(obj.mockMethod).toHaveBeenCalledWith(...) / .toBeCalled()
        //   expect(vi.isMockFunction(obj.mockMethod)).toBe(true)
        //   vi.mocked(obj.mockMethod).mockReturnValue(...)/.mockImplementation(...)
        // In each the method reference is read for call-history or identity, or
        // reconfigured for a later call vitest makes through the real receiver.
        // None detaches it into a bare variable and invokes it without its
        // receiver, which is the bug the rule guards against — so the rule has
        // nothing to catch here, and per-site suppressions would be noise.
        // Re-check that before turning it off anywhere outside __tests__/.
        files: ["__tests__/**"],
        rules: { "typescript/unbound-method": "off" },
      },
    ],
  },

  // The repo's committed style. Changing any of these reformats every file
  // under src/ and __tests__/ in one commit.
  fmt: {
    singleQuote: true,
    semi: true,
    printWidth: 100,
    trailingComma: "all",
  },

  staged: {
    "{src,__tests__}/**/*.ts": "vp check --fix",
    // Oxfmt formats Markdown/YAML; markdownlint does prose/structure linting
    // separately. No Oxfmt equivalent exists for shell scripts or
    // package.json, so neither is reformatted on commit.
    "*.{md,yaml,yml}": "vp fmt --write",
  },

  // Two entries sharing the same source: a self-contained CLI binary and an
  // ESM library build.
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
      // Any dependency with internal dynamic imports makes Rolldown emit
      // multiple chunk files by default — fatal for a single-file bundled
      // binary with no node_modules to resolve sibling chunks from. Keep this
      // off even when no current dependency lazy-loads: it is what stops the
      // single-file invariant from depending on which packages happen to.
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
        //
        // Entries match the specifier, not the package, so a bare "prettier"
        // does NOT cover the `prettier/...` subpaths src/prettier.ts imports —
        // each one has to be listed or it is left external and the binary dies
        // with ERR_MODULE_NOT_FOUND wherever node_modules is absent
        // (integration-bundled-binary.test.ts is the guard for exactly this).
        alwaysBundle: [
          "@actions/core",
          "@actions/github",
          "@svgdotjs/svg.js",
          "chalk",
          "feather-icons",
          "nconf",
          "prettier",
          "prettier/standalone",
          "prettier/plugins/markdown",
          "prettier/plugins/yaml",
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
      // Library (`dist/mjs/`) — ESM-only, no `dist/cjs`. Default
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

  // Vite+ bundles Vitest rather than replacing it, so this is ordinary
  // Vitest config.
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
