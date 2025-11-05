/**
 * Integration test for issue #335
 * This test validates that the github-action-readme-generator fails when executed
 * from a directory other than the project root, simulating an npx or yarn dlx execution.
 *
 * Issue #335: When the package is installed via npm and run via npx/yarn dlx,
 * the action.yml file is not included in the published package (it's not in the
 * "files" array in package.json). The tool tries to load its own action.yml from
 * __dirname/../../action.yml for default values, which fails because the file
 * doesn't exist in the installed package.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import Inputs from '../src/inputs.js';
import LogTask from '../src/logtask/index.js';

describe('Integration Test - Issue #335: Execution from different directory', () => {
  let originalCwd: string;
  let tempDir: string;
  let originalActionYmlPath: string;
  const ACTION_YML_BACKUP = 'action.yml.backup';

  beforeEach(() => {
    // Store the original working directory
    originalCwd = process.cwd();
    // Store the original action.yml path
    originalActionYmlPath = path.resolve(originalCwd, 'action.yml');
  });

  afterEach(() => {
    // Restore the original working directory
    process.chdir(originalCwd);

    // Restore action.yml if we moved it
    if (tempDir && fs.existsSync(path.join(tempDir, ACTION_YML_BACKUP))) {
      fs.renameSync(path.join(tempDir, ACTION_YML_BACKUP), originalActionYmlPath);
    }

    // Clean up the temporary directory if it exists
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should fail when executed from a directory other than the project root', async () => {
    // Step 1: Create a temporary directory to simulate user's project
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-test-335-'));

    // Step 2: Change the current working directory to the temporary directory
    process.chdir(tempDir);

    // Step 3: Create a dummy action.yml file inside the temporary directory
    // This represents the user's action.yml that they want to generate docs for
    const dummyActionContent = `name: Test Action
description: Test Description for issue 335
runs:
  using: node20
  main: index.js
`;
    fs.writeFileSync(path.join(tempDir, 'action.yml'), dummyActionContent);

    // Also create a dummy README.md to satisfy other requirements
    fs.writeFileSync(path.join(tempDir, 'README.md'), '# Test README\n');

    // Create a .git directory with config to simulate a git repository
    const gitDir = path.join(tempDir, '.git');
    fs.mkdirSync(gitDir);
    const gitConfig = `[remote "origin"]
\turl = https://github.com/test-owner/test-repo.git
`;
    fs.writeFileSync(path.join(gitDir, 'config'), gitConfig);

    // Step 4: Temporarily move the tool's action.yml to simulate it being missing
    // (as it would be when installed via npm since it's not in the "files" array)
    const actionYmlMoved = fs.existsSync(originalActionYmlPath);
    if (actionYmlMoved) {
      fs.renameSync(originalActionYmlPath, path.join(tempDir, ACTION_YML_BACKUP));
    }

    // Verify the file was actually moved
    expect(fs.existsSync(originalActionYmlPath)).toBe(false);

    // Step 5: Execute the main function and verify it handles the missing action.yml gracefully
    // The current implementation should NOT throw an error about action.yml being missing
    const log = new LogTask('Generate Documentation');

    // This should NOT fail even though collectAllDefaultValuesFromAction can't load
    // the github-action-readme-generator's own action.yml from __dirname/../../action.yml
    // The fix gracefully handles this by logging a debug message and returning empty defaults
    // In our test, we've moved the action.yml file to simulate this scenario

    // The test validates that the current implementation gracefully handles missing action.yml
    // but still requires other required inputs (paths:action, paths:readme)
    expect(() => {
      // eslint-disable-next-line no-new
      new Inputs({}, log);
    }).toThrow(/Missing required keys/);
  });
});
