/**
 * `--debug_config` exists to diagnose the two ways `Inputs` construction fails:
 * repository detection finding no owner/repo, and a required value being
 * missing. Both throw, and they throw from different calls — so the dump has to
 * be emitted on each path or the flag is silent in exactly the situation it was
 * reached for.
 *
 * Real filesystem and a real `process.argv` here rather than the module-level
 * `node:fs` mock used by inputs.test.ts: that mock serves a `.git/config`
 * naming `ownergit/repogit`, so repository detection cannot fail under it and
 * the failure path would never be exercised.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';

import Inputs from '../src/inputs.js';
import LogTask from '../src/logtask/index.js';

describe('--debug_config dump', () => {
  let originalCwd: string;
  let originalArgv: string[];
  let tempDir: string;
  let logged: string[];

  beforeEach(() => {
    originalCwd = process.cwd();
    originalArgv = process.argv;
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-debug-dump-'));
    process.chdir(tempDir);

    // No .git, no GitHub context: repositoryFinder has nothing to detect from.
    vi.stubEnv('GITHUB_REPOSITORY', '');
    vi.stubEnv('GITHUB_EVENT_PATH', '');
    vi.stubEnv('GITHUB_ACTION', '');

    logged = [];
    vi.spyOn(LogTask.prototype, 'info').mockImplementation((message?: string) => {
      logged.push(message ?? '');
    });
    // repositoryFinder logs through LogTask.error, which emits a `::error::`
    // line. Left to run, every case here would post an error annotation on an
    // otherwise-passing CI run — these failures are the fixture, not a fault.
    vi.spyOn(LogTask.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.argv = originalArgv;
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  const construct = (argv: string[]): (() => Inputs) => {
    process.argv = ['node', 'index.js', ...argv];
    return () => new Inputs({ configPath: path.join(tempDir, '.ghadocs.json') });
  };

  const dumps = (): string[] => logged.filter((message) => message.includes('Resolved config'));

  test('prints when repository detection throws', () => {
    expect(construct(['--debug_config'])).toThrow();

    expect(dumps()).toHaveLength(1);
  });

  test('prints for the older --debug_nconf spelling too', () => {
    expect(construct(['--debug_nconf'])).toThrow();

    expect(dumps()).toHaveLength(1);
  });

  test('stays silent when neither flag was passed', () => {
    expect(construct([])).toThrow();

    expect(dumps()).toHaveLength(0);
  });

  test('prints once, not twice, when detection succeeds', () => {
    // owner/repo supplied, so repositoryFinder is satisfied and the constructor
    // reaches the second dump call. It still throws later, on the missing
    // action.yml, which is what keeps this a construction-failure case.
    expect(construct(['--debug_config', '--owner=acme', '--repo=widget'])).toThrow();

    expect(dumps()).toHaveLength(1);
  });
});
