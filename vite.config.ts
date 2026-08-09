import { defineConfig } from "vite-plus";

// Phase 2 of docs/typescript-7-vite-plus-conversion-plan.md: lint/format/staged
// only. `pack`/`test` blocks land in Phase 3 — do not add them here.
export default defineConfig({
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
});
