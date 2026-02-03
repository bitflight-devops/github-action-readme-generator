/**
 * Integration test for external repository scenarios
 *
 * This test validates that the github-action-readme-generator correctly generates
 * usage sections when running against external repositories (like the integration
 * tests that run against bjia56/setup-cosmocc and catalystcommunity/action-release-action).
 *
 * OBSERVED BUG:
 * When running against external repos, the generated usage line was:
 *   `- uses: /@v0.0.0` or `- uses: owner/repo@undefined`
 * Instead of the expected:
 *   `- uses: owner/repo@version`
 *
 * ROOT CAUSES:
 * 1. owner/repo detection fails when:
 *    - No INPUT_OWNER/INPUT_REPO provided
 *    - No GITHUB_REPOSITORY environment variable
 *    - .git/config is not in the expected location (reads from original CWD, not target dir)
 * 2. Version detection fails because:
 *    - getCurrentVersionString() reads package.json from CWD
 *    - When CWD changes to target repo, it doesn't find the right package.json
 *    - Version defaults to 'undefined' or '0.0.0'
 *
 * TEST EXPECTATIONS:
 * - Tests marked with "BUG REPLICATION" are expected to FAIL with current code
 * - After the fix is applied, these tests should PASS
 * - The test "should throw when owner/repo cannot be determined" verifies error handling
 *
 * KEY EVIDENCE FROM TEST OUTPUT:
 * - "[INFO ][usage] Action name: /" - owner/repo detection failed
 * - "[INFO ][usage] Version string: undefined" - version detection failed
 * - Generated: "- uses: /@undefined" - the exact bug pattern
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Inputs from '../src/inputs.js';
import LogTask from '../src/logtask/index.js';
import { ReadmeGenerator } from '../src/readme-generator.js';

describe('Integration Test - External Repository Scenarios', () => {
  let originalCwd: string;
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store the original working directory and environment
    originalCwd = process.cwd();
    originalEnv = { ...process.env };

    // Create a temporary directory to simulate an external user's project
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-external-repo-test-'));
  });

  afterEach(() => {
    // Restore the original working directory
    process.chdir(originalCwd);

    // Restore environment variables
    process.env = originalEnv;
    vi.unstubAllEnvs();

    // Clean up the temporary directory if it exists
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper function to create a minimal external action.yml
   */
  function createExternalActionYml(dir: string, actionContent: string): string {
    const actionPath = path.join(dir, 'action.yml');
    fs.writeFileSync(actionPath, actionContent);
    return actionPath;
  }

  /**
   * Helper function to create a README.md with usage section markers
   */
  function createReadmeWithMarkers(dir: string): string {
    const readmePath = path.join(dir, 'README.md');
    const readmeContent = `# Test Action

## Description

This is a test action.

## Usage

<!-- start usage -->
<!-- end usage -->

## Inputs

<!-- start inputs -->
<!-- end inputs -->

## Outputs

<!-- start outputs -->
<!-- end outputs -->
`;
    fs.writeFileSync(readmePath, readmeContent);
    return readmePath;
  }

  /**
   * Helper function to create a .git/config file
   */
  function createGitConfig(dir: string, owner: string, repo: string): void {
    const gitDir = path.join(dir, '.git');
    fs.mkdirSync(gitDir, { recursive: true });
    const gitConfig = `[remote "origin"]
\turl = https://github.com/${owner}/${repo}.git
`;
    fs.writeFileSync(path.join(gitDir, 'config'), gitConfig);
  }

  /**
   * Helper function to create a package.json with version
   */
  function createPackageJson(dir: string, version: string): void {
    const packageJson = {
      name: 'test-action',
      version: version,
    };
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(packageJson, null, 2));
  }

  describe('Usage section generation with owner/repo/version', () => {
    /**
     * BUG REPLICATION TEST 1: Version detection from package.json
     *
     * This test replicates the bug where version is 'undefined' instead of
     * being read from the target directory's package.json.
     *
     * Current behavior (BUG): Version string is 'undefined'
     * Expected behavior: Version should be 'v1.2.3' from package.json
     */
    it('BUG REPLICATION: should read version from package.json in CWD', async () => {
      process.chdir(tempDir);

      const actionContent = `name: External Test Action
description: An external action for testing
inputs:
  test-input:
    description: A test input
    required: false
    default: 'default-value'
runs:
  using: node20
  main: index.js
`;
      const actionPath = createExternalActionYml(tempDir, actionContent);
      const readmePath = createReadmeWithMarkers(tempDir);

      // Create package.json with a version - THIS IS THE KEY CONDITION
      createPackageJson(tempDir, '1.2.3');
      createGitConfig(tempDir, 'test-owner', 'test-repo');

      vi.stubEnv('GITHUB_REPOSITORY', '');
      vi.stubEnv('GITHUB_EVENT_PATH', '');
      vi.stubEnv('INPUT_OWNER', 'explicit-owner');
      vi.stubEnv('INPUT_REPO', 'explicit-repo');
      vi.stubEnv('INPUT_ACTION', actionPath);
      vi.stubEnv('INPUT_README', readmePath);

      const log = new LogTask('Test External Repo');

      const inputs = new Inputs(
        {
          configPath: path.join(tempDir, '.ghadocs.json'),
        },
        log,
      );

      expect(inputs.owner).toBe('explicit-owner');
      expect(inputs.repo).toBe('explicit-repo');

      const generator = new ReadmeGenerator(inputs, log);
      await generator.generate();

      const generatedReadme = fs.readFileSync(readmePath, 'utf8');

      // BUG: Currently generates 'undefined' instead of 'v1.2.3'
      // This assertion will FAIL with current code, proving the bug exists
      expect(generatedReadme).toContain('- uses: explicit-owner/explicit-repo@v1.2.3');

      // These should pass even with current code (owner/repo is correct)
      expect(generatedReadme).toContain('- uses: explicit-owner/explicit-repo@');

      // This validation checks for the bug pattern
      expect(generatedReadme).not.toContain('@undefined');
    });

    /**
     * BUG REPLICATION TEST 2: Owner/repo detection from .git/config
     *
     * This test replicates the bug where owner/repo detection fails when
     * running from a different CWD than the original repo.
     *
     * Current behavior (BUG): repositoryFinder looks at .git/config in CWD but
     * we may already be in the temp dir when it runs
     */
    it('BUG REPLICATION: should detect owner/repo from .git/config in CWD', async () => {
      process.chdir(tempDir);

      const actionContent = `name: External Test Action
description: An external action for testing
inputs:
  test-input:
    description: A test input
runs:
  using: node20
  main: index.js
`;
      const actionPath = createExternalActionYml(tempDir, actionContent);
      const readmePath = createReadmeWithMarkers(tempDir);

      // Create .git/config with owner/repo - THIS IS THE KEY CONDITION
      createGitConfig(tempDir, 'git-detected-owner', 'git-detected-repo');
      createPackageJson(tempDir, '2.0.0');

      // Clear all environment variables - force fallback to .git/config
      vi.stubEnv('GITHUB_REPOSITORY', '');
      vi.stubEnv('GITHUB_EVENT_PATH', '');
      vi.stubEnv('INPUT_OWNER', '');
      vi.stubEnv('INPUT_REPO', '');
      vi.stubEnv('INPUT_ACTION', actionPath);
      vi.stubEnv('INPUT_README', readmePath);

      const log = new LogTask('Test Git Config Detection');

      const inputs = new Inputs(
        {
          configPath: path.join(tempDir, '.ghadocs.json'),
        },
        log,
      );

      // BUG: With current code, owner/repo may be empty or undefined
      // These assertions will FAIL with current code, proving the bug exists
      expect(inputs.owner).toBe('git-detected-owner');
      expect(inputs.repo).toBe('git-detected-repo');

      const generator = new ReadmeGenerator(inputs, log);
      await generator.generate();

      const generatedReadme = fs.readFileSync(readmePath, 'utf8');

      // BUG: Currently generates '/@undefined' or similar
      expect(generatedReadme).toContain('- uses: git-detected-owner/git-detected-repo@v2.0.0');
      expect(generatedReadme).not.toContain('- uses: /@');
    });

    /**
     * This test verifies that when ALL detection methods fail,
     * the code properly throws an error (required field validation)
     */
    it('should throw when owner/repo cannot be determined at all', async () => {
      process.chdir(tempDir);

      const actionContent = `name: External Test Action
description: An external action for testing
runs:
  using: node20
  main: index.js
`;
      const actionPath = createExternalActionYml(tempDir, actionContent);
      const readmePath = createReadmeWithMarkers(tempDir);

      // DO NOT create .git/config
      // DO NOT create GITHUB_REPOSITORY

      vi.stubEnv('GITHUB_REPOSITORY', '');
      vi.stubEnv('GITHUB_EVENT_PATH', '');
      vi.stubEnv('INPUT_OWNER', '');
      vi.stubEnv('INPUT_REPO', '');
      vi.stubEnv('INPUT_ACTION', actionPath);
      vi.stubEnv('INPUT_README', readmePath);

      const log = new LogTask('Test No Detection');

      // This should throw because owner/repo cannot be determined
      expect(() => {
        new Inputs(
          {
            configPath: path.join(tempDir, '.ghadocs.json'),
          },
          log,
        );
      }).toThrow();
    });

    /**
     * BUG REPLICATION TEST 3: Complete usage section validation
     *
     * This test validates the exact format that integration tests expect.
     * It should produce: `- uses: owner/repo@vX.Y.Z`
     * NOT: `- uses: /@undefined` or `- uses: /@v0.0.0`
     */
    it('BUG REPLICATION: should generate valid usage section format', async () => {
      process.chdir(tempDir);

      const actionContent = `name: Complete Format Test
description: Testing complete usage format
inputs:
  api-key:
    description: The API key for authentication
    required: true
  debug:
    description: Enable debug mode
    required: false
    default: 'false'
outputs:
  result:
    description: The result of the action
runs:
  using: node20
  main: index.js
`;
      const actionPath = createExternalActionYml(tempDir, actionContent);
      const readmePath = createReadmeWithMarkers(tempDir);
      createGitConfig(tempDir, 'format-test-owner', 'format-test-repo');
      createPackageJson(tempDir, '1.0.0');

      vi.stubEnv('GITHUB_REPOSITORY', '');
      vi.stubEnv('GITHUB_EVENT_PATH', '');
      vi.stubEnv('INPUT_OWNER', '');
      vi.stubEnv('INPUT_REPO', '');
      vi.stubEnv('INPUT_ACTION', actionPath);
      vi.stubEnv('INPUT_README', readmePath);

      const log = new LogTask('Test Format');

      const inputs = new Inputs(
        {
          configPath: path.join(tempDir, '.ghadocs.json'),
        },
        log,
      );

      const generator = new ReadmeGenerator(inputs, log);
      await generator.generate();

      const generatedReadme = fs.readFileSync(readmePath, 'utf8');

      // Extract the usage section
      const usageMatch = generatedReadme.match(
        /<!-- start usage -->\n([\s\S]*?)\n<!-- end usage -->/,
      );
      expect(usageMatch).not.toBeNull();

      const usageSection = usageMatch![1];

      // Validate the usage section format
      expect(usageSection).toContain('```yaml');
      expect(usageSection).toContain('with:');
      expect(usageSection).toContain('api-key:');
      expect(usageSection).toContain('debug:');
      expect(usageSection).toContain('```');

      // The usage reference pattern should be valid: owner/repo@version
      // BUG: Currently may be `/@undefined` or similar
      const usageLineMatch = usageSection.match(/- uses: ([^@]+)@([^\s]+)/);
      expect(usageLineMatch).not.toBeNull();

      // BUG VALIDATION: These should be actual values, not empty/undefined
      const ownerRepo = usageLineMatch![1];
      const version = usageLineMatch![2];

      expect(ownerRepo).toBe('format-test-owner/format-test-repo');
      expect(version).toBe('v1.0.0');

      // Ensure the bug patterns are NOT present
      expect(ownerRepo).not.toBe('/');
      expect(ownerRepo).not.toBe('');
      expect(version).not.toBe('undefined');
      expect(version).not.toBe('v0.0.0');
    });
  });

  /**
   * CI Environment Replication Tests
   *
   * These tests replicate the EXACT conditions in CI workflow:
   * - GITHUB_REPOSITORY is set to the WORKFLOW repo (NOT the target repo)
   * - Target repo is in a subdirectory (test-repo/)
   * - No INPUT_OWNER/INPUT_REPO provided
   * - .git/config in target directory has the correct owner/repo
   *
   * The bug: If code checks GITHUB_REPOSITORY before .git/config in target dir,
   * it would use the WRONG owner/repo from the workflow repo.
   *
   * TEST STATUS:
   * - These tests WILL FAIL if the source code checks GITHUB_REPOSITORY before
   *   checking .git/config in the target directory
   * - These tests WILL PASS once the source code is fixed to prioritize
   *   .git/config in the target directory over GITHUB_REPOSITORY
   *
   * EXPECTED CI BEHAVIOR:
   * The action should detect owner/repo from the TARGET repository's .git/config,
   * NOT from GITHUB_REPOSITORY (which points to the workflow's repository)
   */
  describe('CI Environment Replication - GITHUB_REPOSITORY mismatch', () => {
    /**
     * CI REPLICATION TEST: GITHUB_REPOSITORY is WRONG, .git/config is CORRECT
     *
     * This is the EXACT CI failure condition:
     * - GITHUB_REPOSITORY='bitflight-devops/github-action-readme-generator' (workflow repo)
     * - Target repo .git/config has 'target-owner/target-repo'
     * - No INPUT_OWNER/INPUT_REPO provided
     *
     * Expected: Should detect from .git/config, NOT GITHUB_REPOSITORY
     *
     * SOURCE CODE FIX REQUIRED:
     * The repositoryFinder function in helpers.ts must check .git/config in
     * baseDir (target directory) BEFORE checking GITHUB_REPOSITORY
     */
    it('CI REPLICATION: should use .git/config from target directory, NOT GITHUB_REPOSITORY', async () => {
      process.chdir(tempDir);

      const actionContent = `name: CI Replication Test
description: Testing CI environment where GITHUB_REPOSITORY is wrong
inputs:
  test-input:
    description: A test input
runs:
  using: node20
  main: index.js
`;
      const actionPath = createExternalActionYml(tempDir, actionContent);
      const readmePath = createReadmeWithMarkers(tempDir);

      // Create .git/config with CORRECT owner/repo (simulating target repo)
      createGitConfig(tempDir, 'target-owner', 'target-repo');
      createPackageJson(tempDir, '3.0.0');

      // Set GITHUB_REPOSITORY to WRONG value (simulating CI workflow repo)
      // This is the key CI condition - GITHUB_REPOSITORY != target repo
      vi.stubEnv('GITHUB_REPOSITORY', 'wrong-owner/wrong-repo');
      vi.stubEnv('GITHUB_EVENT_PATH', '');
      // Explicitly NO INPUT_OWNER/INPUT_REPO - simulating CI auto-detection
      vi.stubEnv('INPUT_OWNER', '');
      vi.stubEnv('INPUT_REPO', '');
      vi.stubEnv('INPUT_ACTION', actionPath);
      vi.stubEnv('INPUT_README', readmePath);

      const log = new LogTask('Test CI Replication');

      const inputs = new Inputs(
        {
          configPath: path.join(tempDir, '.ghadocs.json'),
        },
        log,
      );

      // CRITICAL: Should detect from .git/config, NOT GITHUB_REPOSITORY
      expect(inputs.owner).toBe('target-owner');
      expect(inputs.repo).toBe('target-repo');

      const generator = new ReadmeGenerator(inputs, log);
      await generator.generate();

      const generatedReadme = fs.readFileSync(readmePath, 'utf8');

      // Should use target repo owner/repo, NOT the wrong GITHUB_REPOSITORY value
      expect(generatedReadme).toContain('- uses: target-owner/target-repo@v3.0.0');

      // These patterns would indicate the bug - using wrong GITHUB_REPOSITORY
      expect(generatedReadme).not.toContain('wrong-owner');
      expect(generatedReadme).not.toContain('wrong-repo');
    });

    /**
     * CI REPLICATION TEST: Subdirectory structure like CI
     *
     * CI structure:
     * - /action-under-test/ (the github-action-readme-generator checkout)
     * - /test-repo/ (the target repo checkout)
     *
     * The action runs from action-under-test/ but targets files in test-repo/
     *
     * SOURCE CODE FIX REQUIRED:
     * When action.yml path points to a subdirectory (test-repo/action.yml),
     * the code must look for .git/config in that subdirectory, not CWD or
     * GITHUB_REPOSITORY
     */
    it('CI REPLICATION: should detect owner/repo from target subdirectory, not CWD', async () => {
      // Create subdirectory structure like CI
      const targetDir = path.join(tempDir, 'test-repo');
      fs.mkdirSync(targetDir, { recursive: true });

      const actionContent = `name: Subdirectory Test
description: Testing subdirectory detection
runs:
  using: node20
  main: index.js
`;
      const actionPath = createExternalActionYml(targetDir, actionContent);
      const readmePath = createReadmeWithMarkers(targetDir);

      // .git/config is in the target subdirectory
      createGitConfig(targetDir, 'subdir-owner', 'subdir-repo');
      createPackageJson(targetDir, '2.5.0');

      // CWD stays at tempDir (simulating running from action-under-test/)
      // But action/readme paths point to test-repo/
      process.chdir(tempDir);

      // GITHUB_REPOSITORY set to wrong value (workflow repo)
      vi.stubEnv('GITHUB_REPOSITORY', 'workflow-owner/workflow-repo');
      vi.stubEnv('GITHUB_EVENT_PATH', '');
      vi.stubEnv('INPUT_OWNER', '');
      vi.stubEnv('INPUT_REPO', '');
      vi.stubEnv('INPUT_ACTION', actionPath);
      vi.stubEnv('INPUT_README', readmePath);

      const log = new LogTask('Test Subdirectory');

      const inputs = new Inputs(
        {
          configPath: path.join(tempDir, '.ghadocs.json'),
        },
        log,
      );

      // Should detect from target directory's .git/config
      expect(inputs.owner).toBe('subdir-owner');
      expect(inputs.repo).toBe('subdir-repo');

      const generator = new ReadmeGenerator(inputs, log);
      await generator.generate();

      const generatedReadme = fs.readFileSync(readmePath, 'utf8');

      expect(generatedReadme).toContain('- uses: subdir-owner/subdir-repo@v2.5.0');
      expect(generatedReadme).not.toContain('workflow-owner');
    });

    /**
     * CI REPLICATION TEST: Shallow clone without remote URL
     *
     * actions/checkout might create shallow clone where .git/config
     * doesn't have a usable remote URL. In this case, we need explicit inputs.
     */
    it('should fall back to GITHUB_REPOSITORY when .git/config has no remote URL', async () => {
      process.chdir(tempDir);

      const actionContent = `name: Shallow Clone Test
description: Testing shallow clone scenario
runs:
  using: node20
  main: index.js
`;
      const actionPath = createExternalActionYml(tempDir, actionContent);
      const readmePath = createReadmeWithMarkers(tempDir);

      // Create .git/config WITHOUT remote URL (simulating shallow clone)
      const gitDir = path.join(tempDir, '.git');
      fs.mkdirSync(gitDir, { recursive: true });
      fs.writeFileSync(
        path.join(gitDir, 'config'),
        `[core]
\trepositoryformatversion = 0
\tfilemode = true
`,
      );

      // GITHUB_REPOSITORY is set, .git/config has no URL
      vi.stubEnv('GITHUB_REPOSITORY', 'fallback-owner/fallback-repo');
      vi.stubEnv('GITHUB_EVENT_PATH', '');
      vi.stubEnv('INPUT_OWNER', '');
      vi.stubEnv('INPUT_REPO', '');
      vi.stubEnv('INPUT_ACTION', actionPath);
      vi.stubEnv('INPUT_README', readmePath);

      const log = new LogTask('Test Shallow Clone');

      // When .git/config has no URL, GITHUB_REPOSITORY is the correct fallback
      // This is expected behavior - when target repo detection fails, use GITHUB_REPOSITORY
      const inputs = new Inputs(
        {
          configPath: path.join(tempDir, '.ghadocs.json'),
        },
        log,
      );

      // This documents the fallback behavior:
      // When .git/config in target directory has no remote URL,
      // GITHUB_REPOSITORY becomes the fallback source
      expect(inputs.owner).toBe('fallback-owner');
      expect(inputs.repo).toBe('fallback-repo');
    });
  });

  describe('Edge cases for owner/repo/version detection', () => {
    /**
     * BUG REPLICATION TEST 4: GITHUB_REPOSITORY environment variable
     *
     * When GITHUB_REPOSITORY is set, it should be used for owner/repo detection.
     * Version should still come from the CWD's package.json.
     */
    it('BUG REPLICATION: should use GITHUB_REPOSITORY for owner/repo', async () => {
      process.chdir(tempDir);

      const actionContent = `name: GitHub Env Test
description: Testing GITHUB_REPOSITORY detection
runs:
  using: node20
  main: index.js
`;
      const actionPath = createExternalActionYml(tempDir, actionContent);
      const readmePath = createReadmeWithMarkers(tempDir);
      createPackageJson(tempDir, '4.0.0');

      // Set GITHUB_REPOSITORY - this should be used
      vi.stubEnv('GITHUB_REPOSITORY', 'env-owner/env-repo');
      vi.stubEnv('GITHUB_EVENT_PATH', '');
      vi.stubEnv('INPUT_OWNER', '');
      vi.stubEnv('INPUT_REPO', '');
      vi.stubEnv('INPUT_ACTION', actionPath);
      vi.stubEnv('INPUT_README', readmePath);

      const log = new LogTask('Test GitHub Env');

      const inputs = new Inputs(
        {
          configPath: path.join(tempDir, '.ghadocs.json'),
        },
        log,
      );

      // BUG: owner/repo may not be correctly extracted from GITHUB_REPOSITORY
      expect(inputs.owner).toBe('env-owner');
      expect(inputs.repo).toBe('env-repo');

      const generator = new ReadmeGenerator(inputs, log);
      await generator.generate();

      const generatedReadme = fs.readFileSync(readmePath, 'utf8');

      // BUG: version may be undefined instead of v4.0.0
      expect(generatedReadme).toContain('- uses: env-owner/env-repo@v4.0.0');
    });

    /**
     * BUG REPLICATION TEST 5: Missing package.json
     *
     * When package.json is missing, version should fallback gracefully.
     * But owner/repo detection should still work from .git/config.
     */
    it('BUG REPLICATION: owner/repo should work even without package.json', async () => {
      process.chdir(tempDir);

      const actionContent = `name: No Package JSON Test
description: Testing without package.json
runs:
  using: node20
  main: index.js
`;
      const actionPath = createExternalActionYml(tempDir, actionContent);
      const readmePath = createReadmeWithMarkers(tempDir);
      createGitConfig(tempDir, 'no-pkg-owner', 'no-pkg-repo');

      // DO NOT create package.json

      vi.stubEnv('GITHUB_REPOSITORY', '');
      vi.stubEnv('GITHUB_EVENT_PATH', '');
      vi.stubEnv('INPUT_OWNER', '');
      vi.stubEnv('INPUT_REPO', '');
      vi.stubEnv('INPUT_ACTION', actionPath);
      vi.stubEnv('INPUT_README', readmePath);

      const log = new LogTask('Test No Package JSON');

      const inputs = new Inputs(
        {
          configPath: path.join(tempDir, '.ghadocs.json'),
        },
        log,
      );

      const generator = new ReadmeGenerator(inputs, log);
      await generator.generate();

      const generatedReadme = fs.readFileSync(readmePath, 'utf8');

      // BUG: owner/repo detection is failing, resulting in '/@'
      // Even without package.json, owner/repo should be detected from .git/config
      expect(generatedReadme).toContain('- uses: no-pkg-owner/no-pkg-repo@');

      // This is the key bug validation - owner/repo should NOT be empty
      expect(generatedReadme).not.toContain('- uses: /@');

      // Version can be 0.0.0 or undefined when package.json is missing
      // but the format should not be completely broken
      expect(generatedReadme).not.toContain('- uses: /@undefined');
    });

    /**
     * BUG REPLICATION TEST 6: INPUT_OWNER/INPUT_REPO priority
     *
     * INPUT_OWNER/INPUT_REPO should take priority over GITHUB_REPOSITORY.
     * This is how the integration tests pass owner/repo to the tool.
     */
    it('BUG REPLICATION: INPUT_OWNER/INPUT_REPO should take priority', async () => {
      process.chdir(tempDir);

      const actionContent = `name: Priority Test
description: Testing input priority
runs:
  using: node20
  main: index.js
`;
      const actionPath = createExternalActionYml(tempDir, actionContent);
      const readmePath = createReadmeWithMarkers(tempDir);
      createGitConfig(tempDir, 'git-owner', 'git-repo');
      createPackageJson(tempDir, '5.0.0');

      // Set both - INPUT_OWNER/INPUT_REPO should take priority
      vi.stubEnv('GITHUB_REPOSITORY', 'github-owner/github-repo');
      vi.stubEnv('GITHUB_EVENT_PATH', '');
      vi.stubEnv('INPUT_OWNER', 'input-owner');
      vi.stubEnv('INPUT_REPO', 'input-repo');
      vi.stubEnv('INPUT_ACTION', actionPath);
      vi.stubEnv('INPUT_README', readmePath);

      const log = new LogTask('Test Priority');

      const inputs = new Inputs(
        {
          configPath: path.join(tempDir, '.ghadocs.json'),
        },
        log,
      );

      // INPUT_OWNER/INPUT_REPO should take priority
      expect(inputs.owner).toBe('input-owner');
      expect(inputs.repo).toBe('input-repo');

      const generator = new ReadmeGenerator(inputs, log);
      await generator.generate();

      const generatedReadme = fs.readFileSync(readmePath, 'utf8');

      // BUG: version is undefined instead of v5.0.0
      expect(generatedReadme).toContain('- uses: input-owner/input-repo@v5.0.0');
    });
  });
});
