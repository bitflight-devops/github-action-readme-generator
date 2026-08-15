/**
 * nconf resolves in the order stores are registered — the first store holding a
 * key wins. `loadConfig` registers argv, then the config file, then env:
 *
 *   --pretty=false  beats  .ghadocs.json  beats  INPUT_PRETTY
 *
 * env sits below the file on purpose. The GitHub Actions runner exports an
 * INPUT_* variable for every action.yml input carrying a default, named under
 * `with:` or not, so putting env on top would let those metadata defaults
 * outrank a project's persisted config.
 *
 * Real files and a real `process.argv` here rather than the module-level
 * `node:fs` mock used by inputs.test.ts: registration order is only observable
 * when the file store actually reads a file.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { Provider } from 'nconf';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';

import { loadConfig } from '../src/inputs.js';
import LogTask from '../src/logtask/index.js';

vi.mock('../src/logtask/index.js');

describe('loadConfig store precedence', () => {
  let tempDir: string;
  let configPath: string;
  let originalArgv: string[];

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-precedence-'));
    configPath = path.join(tempDir, '.ghadocs.json');
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  /** Runs loadConfig with the given config-file contents and CLI args. */
  const resolve = (fileContents: object, argv: string[] = []): Provider => {
    fs.writeFileSync(configPath, JSON.stringify(fileContents), 'utf8');
    process.argv = ['node', 'index.js', ...argv];

    return loadConfig(new LogTask('precedence'), new Provider(), configPath);
  };

  test('uses the config file when nothing else supplies the key', () => {
    expect(resolve({ prettier: false }).get('prettier')).toBe(false);
  });

  test('a CLI flag overrides the config file', () => {
    expect(resolve({ prettier: false }, ['--pretty=true']).get('prettier')).toBe(true);
  });

  test('a CLI flag overrides the config file in the other direction too', () => {
    expect(resolve({ prettier: true }, ['--pretty=false']).get('prettier')).toBe(false);
  });

  // The runner exports INPUT_PRETTY / INPUT_README on every run from the
  // action.yml defaults, so letting env win here would make .ghadocs.json
  // unusable for any defaulted key when running as an action.
  test('the config file overrides an action input', () => {
    vi.stubEnv('INPUT_PRETTY', 'true');

    expect(resolve({ prettier: false }).get('prettier')).toBe(false);
  });

  test('an action input still applies for a key the config file omits', () => {
    vi.stubEnv('INPUT_PRETTY', 'false');

    expect(resolve({ owner: 'acme' }).get('prettier')).toBe(false);
  });

  test('a CLI flag outranks both the config file and an action input', () => {
    vi.stubEnv('INPUT_PRETTY', 'false');

    expect(resolve({ prettier: false }, ['--pretty=true']).get('prettier')).toBe(true);
  });

  test('keys the config file alone supplies still resolve', () => {
    const config = resolve({ owner: 'acme', prettier: false }, ['--pretty=true']);

    expect(config.get('owner')).toBe('acme');
    expect(config.get('prettier')).toBe(true);
  });

  test('a missing config file leaves the CLI flag intact', () => {
    process.argv = ['node', 'index.js', '--pretty=false'];

    const config = loadConfig(
      new LogTask('precedence'),
      new Provider(),
      path.join(tempDir, 'absent.json'),
    );

    expect(config.get('prettier')).toBe(false);
  });
});
