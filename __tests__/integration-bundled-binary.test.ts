/**
 * Integration test that validates the bundled dist/bin/index.js binary
 * is self-contained and does not require external node_modules at runtime.
 *
 * REGRESSION TEST FOR: ERR_MODULE_NOT_FOUND: Cannot find package 'prettier'
 *
 * ROOT CAUSE:
 * `prettier` was listed in the `external` array in scripts/esbuild.mjs, which
 * excluded it from the bundle. When the action runs in a user's workflow, only
 * `dist/` is present — there is no `node_modules/prettier` to resolve.
 *
 * THE FIX:
 * Removed `prettier` from the `external` array so it gets bundled into
 * dist/bin/index.js. Since prettier is a declared `dependency` (not
 * devDependency) in package.json, bundling it is correct.
 *
 * WHAT THIS TEST VALIDATES:
 * - The dist/bin/index.js binary runs successfully in an isolated temporary
 *   directory that has no node_modules directory
 * - No ERR_MODULE_NOT_FOUND error for 'prettier' or any other bundled dep
 * - The binary produces valid README output when given a valid action.yml
 */
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('Integration Test - Bundled Binary Self-Containment', () => {
  let tempDir: string;
  const binaryPath = path.resolve(
    import.meta.dirname,
    '../dist/bin/index.js',
  );

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-bundled-binary-test-'));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('dist/bin/index.js exists and is executable', () => {
    expect(fs.existsSync(binaryPath), `dist/bin/index.js not found at ${binaryPath}`).toBe(true);
    const stat = fs.statSync(binaryPath);
    // Check that it's a file with non-zero size (bundled with prettier it should be >20MB)
    expect(stat.size).toBeGreaterThan(1024 * 1024); // at least 1MB
  });

  it('binary runs without ERR_MODULE_NOT_FOUND for prettier when no node_modules present', () => {
    // Set up a minimal action.yml and README.md in tempDir (no node_modules)
    const actionYml = `name: Test Action
description: A test action for bundled binary validation
inputs:
  my-input:
    description: A test input
    required: false
    default: hello
outputs:
  my-output:
    description: A test output
runs:
  using: node20
  main: index.js
`;
    fs.writeFileSync(path.join(tempDir, 'action.yml'), actionYml);

    const readmeMd = `# Test Action

<!-- start title -->
<!-- end title -->

<!-- start description -->
<!-- end description -->

<!-- start usage -->
<!-- end usage -->

<!-- start inputs -->
<!-- end inputs -->

<!-- start outputs -->
<!-- end outputs -->
`;
    const readmePath = path.join(tempDir, 'README.md');
    fs.writeFileSync(readmePath, readmeMd);

    // Copy the binary into tempDir so Node.js resolves modules from tempDir,
    // not from the project root (which has node_modules/prettier). This accurately
    // simulates the GitHub Actions runner where only dist/ is available without
    // an adjacent node_modules directory.
    const isolatedBinaryPath = path.join(tempDir, 'index.js');
    fs.copyFileSync(binaryPath, isolatedBinaryPath);
    fs.chmodSync(isolatedBinaryPath, 0o755);

    // Confirm no node_modules are present in the isolated directory
    expect(fs.existsSync(path.join(tempDir, 'node_modules'))).toBe(false);

    // Run the binary from tempDir — no node_modules anywhere in the hierarchy above tempDir
    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    try {
      stdout = execSync(
        `node "${isolatedBinaryPath}" --owner testowner --repo testrepo` +
          ` --paths:action "${path.join(tempDir, 'action.yml')}"` +
          ` --paths:readme "${readmePath}"`,
        {
          cwd: tempDir,
          encoding: 'utf8',
          env: {
            ...process.env,
            // Clear GitHub Actions env vars to avoid side effects
            GITHUB_ACTIONS: undefined,
            GITHUB_REPOSITORY: undefined,
            INPUT_OWNER: undefined,
            INPUT_REPO: undefined,
          },
        },
      );
    } catch (error: unknown) {
      const execError = error as { stdout?: string; stderr?: string; status?: number };
      stdout = execError.stdout ?? '';
      stderr = execError.stderr ?? '';
      exitCode = execError.status ?? 1;
    }

    // The binary must NOT fail with ERR_MODULE_NOT_FOUND for prettier
    expect(stderr).not.toContain('ERR_MODULE_NOT_FOUND');
    expect(stderr).not.toContain("Cannot find package 'prettier'");

    // The binary should succeed (exit 0)
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    // The README should be updated with generated content
    const generatedReadme = fs.readFileSync(readmePath, 'utf8');
    expect(generatedReadme).toContain('testowner/testrepo');
  });
});
