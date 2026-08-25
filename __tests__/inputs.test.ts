import * as fs from 'node:fs';
import * as path from 'node:path';

import { Provider } from 'nconf';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import YAML from 'yaml';

import Action from '../src/Action.js';
import type { ReadmeSection } from '../src/constants.js';
import Inputs, {
  collectAllDefaultValuesFromAction,
  type InputContext,
  isDebugConfigEnabled,
  loadAction,
  REDACTED,
  redactSensitiveValues,
  loadConfig,
  loadDefaultConfig,
  loadRequiredConfig,
  setConfigValueFromActionFileDefault,
  transformGitHubInputsToArgv,
} from '../src/inputs.js';
import LogTask from '../src/logtask/index.js';
import ReadmeEditor from '../src/readme-editor.js';
import { actionTestString } from './action.constants.js';

// Mocking required objects and functions
vi.mock('node:fs', async () => {
  return import('../__mocks__/node:fs.js');
});
vi.mock('@actions/core');
vi.mock('../src/Action.js');
// Partially real: the automock empties README_SECTIONS, and
// redactSensitiveValues now uses that list to decide whether a `sections` entry
// is one this tool acts on. With an empty list every entry looks unrecognised,
// so the dump would redact a section name the tool does in fact honour.
vi.mock('../src/constants.js', async () =>
  vi.importActual<typeof import('../src/constants.js')>('../src/constants.js'),
);
vi.mock('../src/logtask/index.js');
vi.mock('../src/readme-editor.js');

describe('inputs', () => {
  const readmeTestPath = './README.test.md';
  const actTestYmlPath = './action.test.yml';
  // const fsMocksFile = './mocks/fs.js';
  const payloadFile = path.join(import.meta.dirname, 'payload.json');

  describe('test mocks work', () => {
    test('Yaml parses correctly', () => {
      const y = YAML.parse(actionTestString);
      expect(y.name).toBe('Test Action');
    });

    test('readFileSync is mocked', () => {
      expect(vi.isMockFunction(fs.readFileSync)).toBe(true);
      expect(fs.readFileSync(actTestYmlPath, 'utf8')).toBe(actionTestString);
      expect(fs.readFileSync('.git/config', 'utf8')).toBe(
        `[remote "origin"]\nurl = https://github.com/ownergit/repogit.git\n`,
      );
    });

    test('statSync is mocked', () => {
      expect(vi.isMockFunction(fs.statSync)).toBe(true);
      expect(fs.statSync(actTestYmlPath).isFile()).toBe(true);
    });

    test('existsSync is mocked', () => {
      expect(vi.isMockFunction(fs.existsSync)).toBe(true);
      expect(fs.existsSync(actTestYmlPath)).toBe(true);
    });
  });

  describe('Test exported functions', () => {
    beforeEach(() => {
      vi.stubEnv('GITHUB_EVENT_PATH', payloadFile);
      vi.stubEnv('GITHUB_REPOSITORY', '');
      vi.stubEnv('INPUT_README', readmeTestPath);
      vi.stubEnv('INPUT_ACTION', actTestYmlPath);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });

    test('transformGitHubInputsToArgv', ({ task }) => {
      const log = new LogTask(task.name);
      const config = new Provider();
      const obj1 = { key: 'INPUT_TEST', value: 'testValue1' };
      const obj2 = { key: 'input_test', value: 'testValue2' };
      let result = transformGitHubInputsToArgv(log, config, obj1);
      expect(result).toEqual({ key: 'test', value: 'testValue1' });
      result = transformGitHubInputsToArgv(log, config, obj2);
      expect(result).toEqual({ key: 'test', value: 'testValue2' });
    });

    test('setConfigValueFromActionFileDefault', async ({ task }) => {
      const log = new LogTask(task.name);
      const { default: Action } = await import('../src/Action.js');
      const actionInstance = new Action(actTestYmlPath);
      const inputName = 'testInput';

      const result = setConfigValueFromActionFileDefault(log, actionInstance, inputName);
      expect(result).toBeUndefined();
    });

    test('collectAllDefaultValuesFromAction', ({ task }) => {
      const log = new LogTask(task.name);

      const result = collectAllDefaultValuesFromAction(log, actTestYmlPath);
      expect(result).toEqual({});
    });

    test('collectAllDefaultValuesFromAction with non-existent action.yml', ({ task }) => {
      const log = new LogTask(task.name);

      // Test with a path that doesn't exist (simulating CLI usage where action.yml is missing)
      // When running as a CLI tool via npx/yarn dlx, the tool's own action.yml may not be
      // present in node_modules, which is expected behavior
      const result = collectAllDefaultValuesFromAction(log, './non-existent-action.yml');
      expect(result).toEqual({});
    });

    test('collectAllDefaultValuesFromAction loads this actions own action.yml', ({ task }) => {
      const log = new LogTask(task.name);

      // This test verifies that collectAllDefaultValuesFromAction loads THIS action's own action.yml
      // (github-action-readme-generator's action.yml), not the user's action.yml
      // It uses import.meta.dirname to find the action.yml file relative to where the code is installed
      const relativePath = actTestYmlPath;
      const result = collectAllDefaultValuesFromAction(log, relativePath);

      // The test passes if it successfully loads the action defaults
      // This works because the test mock provides the action.yml in the expected location
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    describe('redactSensitiveValues', () => {
      // The dump exists to be pasted into bug reports, and GitHub sets INPUT_* for
      // every `with:` key whether action.yml declares it or not.
      test.each([
        'token',
        'api_token',
        'GITHUB_TOKEN',
        'password',
        'passwd',
        'secret',
        'authToken',
        'apiKey',
        'credential',
      ])('masks %s', (key) => {
        expect(redactSensitiveValues({ [key]: 'sensitive' })).toEqual({ [key]: REDACTED });
      });

      test('leaves the keys the tool reads alone', () => {
        expect(redactSensitiveValues({ owner: 'acme', prettier: true, save: false })).toEqual({
          owner: 'acme',
          prettier: true,
          save: false,
        });
      });

      test('recurses into nested groups', () => {
        expect(
          redactSensitiveValues({ versioning: { token: 'x', prefix: 'v' }, owner: 'acme' }),
        ).toEqual({ versioning: { token: REDACTED, prefix: 'v' }, owner: 'acme' });
      });

      test('keeps a known group intact', () => {
        expect(
          redactSensitiveValues({ paths: { action: 'action.yml', readme: 'README.md' } }),
        ).toEqual({ paths: { action: 'action.yml', readme: 'README.md' } });
      });

      test('walks arrays under a known key', () => {
        expect(redactSensitiveValues({ sections: ['title', 'inputs'] })).toEqual({
          sections: ['title', 'inputs'],
        });
      });

      test('replaces a masked key whole rather than descending into it', () => {
        expect(redactSensitiveValues({ token: { nested: 'still-secret' } })).toEqual({
          token: REDACTED,
        });
      });

      // A name heuristic alone cannot make the dump safe: nconf admits any key a
      // CLI flag, `.ghadocs.json` entry or INPUT_* variable supplies, and a
      // credential can arrive under a name no pattern flags. Anything the tool
      // does not itself read is masked on that basis.
      test.each(['webhook', 'endpoint', 'callback_url', 'x'])(
        'masks the unrecognised key %s',
        (key) => {
          expect(redactSensitiveValues({ [key]: 'https://hooks.example/abc123' })).toEqual({
            [key]: REDACTED,
          });
        },
      );

      test('masks an unrecognised key without descending into it', () => {
        expect(redactSensitiveValues({ webhook: { url: 'https://hooks.example/abc123' } })).toEqual(
          {
            webhook: REDACTED,
          },
        );
      });

      test('masks an unrecognised key nested inside a known group', () => {
        expect(
          redactSensitiveValues({ versioning: { prefix: 'v', webhook: 'https://x/y' } }),
        ).toEqual({ versioning: { prefix: 'v', webhook: REDACTED } });
      });

      // A known key names a value the tool reads, not a subtree to trust. The
      // config sources admit any shape, so a caller can land an object under a
      // scalar key; without this the allow-list would wave the whole subtree
      // through on reaching the known leaf.
      test('masks an object supplied under a known scalar key', () => {
        expect(
          redactSensitiveValues({ owner: { webhook: 'https://hooks.example/abc123' } }),
        ).toEqual({ owner: REDACTED });
      });

      test('masks an array of objects supplied under a known scalar key', () => {
        expect(
          redactSensitiveValues({ owner: [{ webhook: 'https://hooks.example/abc' }] }),
        ).toEqual({ owner: REDACTED });
      });

      test('keeps an array of scalars under a known key, as sections holds one', () => {
        expect(redactSensitiveValues({ sections: ['title', 'inputs'] })).toEqual({
          sections: ['title', 'inputs'],
        });
      });

      // Each known key declares one shape; every other shape is masked. Three
      // successive fixes here each closed one hole and left its mirror open, so
      // this covers the matrix rather than the reported cases: three kinds of
      // key against four kinds of value.
      //
      // `null` is the one deliberate asymmetry — it counts as a scalar, because
      // printing `null` discloses nothing.
      const LEAK = 'https://hooks.example/secret';
      describe.each([
        ['a scalar key', 'owner'],
        ['a nested scalar key', 'versioning'],
      ])('%s', (_label, topKey) => {
        const wrap = (value: unknown): Record<string, unknown> =>
          topKey === 'versioning' ? { versioning: { prefix: value } } : { owner: value };
        const expected = (value: unknown): Record<string, unknown> =>
          topKey === 'versioning' ? { versioning: { prefix: value } } : { owner: value };

        test('keeps a scalar', () => {
          expect(redactSensitiveValues(wrap('acme'))).toEqual(expected('acme'));
        });

        test('masks an object', () => {
          expect(redactSensitiveValues(wrap({ webhook: LEAK }))).toEqual(expected(REDACTED));
        });

        test('masks an array of scalars', () => {
          expect(redactSensitiveValues(wrap([LEAK]))).toEqual(expected(REDACTED));
        });

        test('masks an array of objects', () => {
          expect(redactSensitiveValues(wrap([{ webhook: LEAK }]))).toEqual(expected(REDACTED));
        });
      });

      describe('the sections key, the only one holding an array', () => {
        test('keeps an array whose every entry names a README section', () => {
          expect(redactSensitiveValues({ sections: ['title', 'inputs'] })).toEqual({
            sections: ['title', 'inputs'],
          });
        });

        test('masks an array containing an object', () => {
          expect(redactSensitiveValues({ sections: [{ webhook: LEAK }] })).toEqual({
            sections: REDACTED,
          });
        });

        test('masks a bare scalar', () => {
          expect(redactSensitiveValues({ sections: LEAK })).toEqual({ sections: REDACTED });
        });

        test('masks an object', () => {
          expect(redactSensitiveValues({ sections: { a: LEAK } })).toEqual({ sections: REDACTED });
        });
      });

      describe.each(['paths', 'versioning', 'debug'])('the %s group key', (key) => {
        test('masks a scalar', () => {
          expect(redactSensitiveValues({ [key]: LEAK })).toEqual({ [key]: REDACTED });
        });

        test('masks an array', () => {
          expect(redactSensitiveValues({ [key]: [LEAK] })).toEqual({ [key]: REDACTED });
        });

        test('masks null', () => {
          expect(redactSensitiveValues({ [key]: null })).toEqual({ [key]: REDACTED });
        });
      });

      // `sections` names a finite domain, so shape alone is not enough: an entry
      // outside README_SECTIONS is a value updateSection ignores, which makes it
      // exactly as unread as an unknown key.
      test('masks a sections list containing an unrecognised name', () => {
        expect(redactSensitiveValues({ sections: ['title', LEAK] })).toEqual({
          sections: REDACTED,
        });
      });

      // ConfigKeys declares debug:readme, debug:action and debug:github, but no
      // reader exists for any of them and no action input or CLI flag sets one.
      // A value under one arrived from .ghadocs.json and is never consumed, so
      // it is as unread as an unknown key.
      test.each(['readme', 'action', 'github'])('masks debug.%s, which nothing reads', (key) => {
        expect(redactSensitiveValues({ debug: { [key]: LEAK } })).toEqual({
          debug: { [key]: REDACTED },
        });
      });

      // Keys whose declared domain is a boolean. Some readers compare against
      // boolean literals (`save`, `prettier`, `versioning:enabled`, the dump
      // flags) and some gate on truthiness (`branding_as_title_prefix`,
      // `versioning:badge`) — either way no code path reads the value's bytes,
      // so a non-boolean is as unread as an unknown key's value.
      describe.each([
        ['save', (value: unknown) => ({ save: value })],
        ['prettier', (value: unknown) => ({ prettier: value })],
        ['versioning.enabled', (value: unknown) => ({ versioning: { enabled: value } })],
        ['versioning.badge', (value: unknown) => ({ versioning: { badge: value } })],
        ['branding_as_title_prefix', (value: unknown) => ({ branding_as_title_prefix: value })],
        ['debug.config', (value: unknown) => ({ debug: { config: value } })],
        ['debug.nconf', (value: unknown) => ({ debug: { nconf: value } })],
      ])('the boolean key %s', (_name, wrap) => {
        test.each([[true], [false], ['true'], ['false']])('keeps %o', (value) => {
          expect(redactSensitiveValues(wrap(value))).toEqual(wrap(value));
        });

        test('masks a non-boolean', () => {
          expect(redactSensitiveValues(wrap(LEAK))).toEqual(wrap(REDACTED));
        });
      });

      // `versioning:source` selects from a closed set; getCurrentVersionString
      // treats anything else as git-tag, so an unrecognised value is unread.
      test.each(['git-tag', 'git-branch', 'git-sha', 'package-json', 'explicit'])(
        'keeps the version source %s',
        (source) => {
          expect(redactSensitiveValues({ versioning: { source } })).toEqual({
            versioning: { source },
          });
        },
      );

      test('masks an unrecognised version source', () => {
        expect(redactSensitiveValues({ versioning: { source: LEAK } })).toEqual({
          versioning: { source: REDACTED },
        });
      });

      // A truthiness gate consumes the value's truthiness and nothing else, so
      // a credential-bearing string under one turns the feature on without any
      // of its bytes being read. action.yml declares both as booleans, so the
      // string is malformed input and masking it costs the dump nothing.
      test.each([
        ['branding_as_title_prefix', (value: unknown) => ({ branding_as_title_prefix: value })],
        ['versioning.badge', (value: unknown) => ({ versioning: { badge: value } })],
      ])('masks a truthy non-boolean under %s', (_name, wrap) => {
        expect(redactSensitiveValues(wrap(LEAK))).toEqual(wrap(REDACTED));
      });

      // Action-input and CLI spellings are input names, not resolved keys. The
      // file store maps nothing, so `{"action": "…"}` in .ghadocs.json leaves a
      // key nothing reads. When a value does arrive through an alias, the argv
      // store records the canonical key too, so masking these loses nothing.
      test.each(['action', 'readme', 'pretty', 'version_prefix', 'debug_config'])(
        'masks the alias spelling %s',
        (key) => {
          expect(redactSensitiveValues({ [key]: LEAK })).toEqual({ [key]: REDACTED });
        },
      );

      test('still shows the canonical key an alias resolves to', () => {
        expect(
          redactSensitiveValues({ paths: { action: 'action.yml' }, action: 'action.yml' }),
        ).toEqual({ paths: { action: 'action.yml' }, action: REDACTED });
      });

      // `image_generated` is the only key the tool both writes and reads back
      // without it appearing in ConfigKeys: `generateImgMarkup` compares it
      // against `${icon}${color}` to decide whether to regenerate the SVG. Its
      // domain is therefore exactly the concatenations that comparison can
      // match, and a reporter needs to see the value to explain unexpected
      // regeneration.
      describe('the branding cache key', () => {
        test.each(['book-openyellow', 'activityblue'])('keeps the producible hash %s', (hash) => {
          expect(redactSensitiveValues({ image_generated: hash })).toEqual({
            image_generated: hash,
          });
        });

        test.each([
          ['an unknown icon', 'not-an-iconblue'],
          ['an unknown colour', 'activitychartreuse'],
          ['a bare credential', LEAK],
          ['an empty string', ''],
        ])('masks %s', (_label, value) => {
          expect(redactSensitiveValues({ image_generated: value })).toEqual({
            image_generated: REDACTED,
          });
        });

        test.each([[{ webhook: LEAK }], [[LEAK]], [null]])('masks the non-scalar %o', (value) => {
          expect(redactSensitiveValues({ image_generated: value })).toEqual({
            image_generated: REDACTED,
          });
        });
      });

      test("masks nconf and yargs bookkeeping keys the tool doesn't read", () => {
        expect(redactSensitiveValues({ _: [], $0: '/path/to/index.js', owner: 'acme' })).toEqual({
          _: REDACTED,
          $0: REDACTED,
          owner: 'acme',
        });
      });

      test.each([[null], [undefined], ['plain'], [7], [true]])('passes %o through', (value) => {
        expect(redactSensitiveValues(value)).toEqual(value);
      });
    });

    describe('isDebugConfigEnabled', () => {
      // A bare Provider retains nothing — set() needs a store registered first,
      // which the real loadConfig supplies via argv/env/file.
      const withValue = (key: string, value: unknown): Provider => {
        const config = new Provider();
        config.use('memory');
        config.set(key, value);
        return config;
      };

      test('is off when neither flag is set', () => {
        const config = new Provider();
        config.use('memory');

        expect(isDebugConfigEnabled(config)).toBe(false);
      });

      // Both flags carry the identical describe text, so either has to work.
      test.each([
        ['debug:config', true],
        ['debug:config', 'true'],
        ['debug:nconf', true],
        ['debug:nconf', 'true'],
      ])('is on when %s is %o', (key, value) => {
        expect(isDebugConfigEnabled(withValue(key, value))).toBe(true);
      });

      test.each([
        ['debug:config', false],
        ['debug:config', 'false'],
        ['debug:nconf', false],
        ['debug:nconf', 'false'],
        ['debug:config', 'yes'],
        ['debug:config', 1],
      ])('is off when %s is %o', (key, value) => {
        expect(isDebugConfigEnabled(withValue(key, value))).toBe(false);
      });
    });

    test('loadConfig', ({ task }) => {
      const log = new LogTask(task.name);
      const providedConfig = new Provider();
      const configFilePath = './configFile';

      const result = loadConfig(log, providedConfig, configFilePath);
      expect(result).toBeInstanceOf(Provider);
    });

    test('loadConfig parses one CLI section as an array', ({ task }) => {
      const originalArgv = process.argv;
      process.argv = ['node', 'script', '--sections=usage'];
      try {
        const config = loadConfig(new LogTask(task.name), new Provider());
        expect(config.get('sections')).toEqual(['usage']);
      } finally {
        process.argv = originalArgv;
      }
    });

    test('loadConfig parses repeated CLI sections as an array', ({ task }) => {
      const originalArgv = process.argv;
      process.argv = ['node', 'script', '--sections=usage', '--sections=inputs'];
      try {
        const config = loadConfig(new LogTask(task.name), new Provider());
        expect(config.get('sections')).toEqual(['usage', 'inputs']);
      } finally {
        process.argv = originalArgv;
      }
    });

    describe('loadGithubContext', () => {
      beforeEach(() => {
        // const { statSync, readFileSync, existsSync } =
        //   await vi.importActual<typeof import('../__mocks__/fs.js')>(fsMocksFile);
        // vi.mocked(fs.statSync).mockImplementation(statSync);
        // vi.mocked(fs.existsSync).mockImplementation(existsSync);
        // vi.mocked(fs.readFileSync).mockImplementation(readFileSync);
        vi.stubEnv('GITHUB_EVENT_PATH', payloadFile);
        vi.stubEnv('GITHUB_REPOSITORY', '');
        vi.stubEnv('INPUT_README', readmeTestPath);
        vi.stubEnv('INPUT_ACTION', actTestYmlPath);
      });
      afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
      });

      test('loadDefaultConfig from github context GITHUB_REPOSITORY env var', ({ task }) => {
        vi.stubEnv('GITHUB_REPOSITORY', 'user2/test2');
        process.env.INPUT_USER = undefined;
        process.env.INPUT_REPO = undefined;
        const log = new LogTask(task.name);
        const config = new Provider();
        const result = loadDefaultConfig(log, config);
        expect(result.get('owner')).toBe('user2');
        expect(result.get('repo')).toBe('test2');
      });
      test('loadDefaultConfig from provided context payload', ({ task }) => {
        process.env.INPUT_USER = undefined;
        process.env.INPUT_REPO = undefined;
        process.env.GITHUB_REPOSITORY = undefined;
        vi.stubEnv('GITHUB_REPOSITORY', '');

        const log = new LogTask(task.name);
        const config = new Provider();
        loadDefaultConfig(log, config);
        expect(config.get('owner')).toBe('userpayload');
        expect(config.get('repo')).toBe('testpayload');
      });
    });
    test('loadDefaultConfig', ({ task }) => {
      const log = new LogTask(task.name);
      const config = new Provider();

      const result = loadDefaultConfig(log, config);
      expect(result).toBeInstanceOf(Provider);
    });

    test('loadRequiredConfig: config exists', ({ task }) => {
      const log = new LogTask(task.name);
      const config = new Provider();
      expect(config).toBeInstanceOf(Provider);

      config.defaults({
        owner: 'testowner',
        repo: 'testrepo',
        paths: {
          readme: 'testreadme',
          action: 'testaction',
        },
      });

      loadRequiredConfig(log, config);
      expect(config.get('owner')).toBe('testowner');
      expect(config.get('repo')).toBe('testrepo');
      const pathsObj = config.get('paths');
      expect(pathsObj.readme).toBe('testreadme');
      expect(pathsObj.action).toBe('testaction');
    });
    test('loadRequiredConfig: config missing', ({ task }) => {
      const log = new LogTask(task.name);
      const config = new Provider();

      // Clear INPUT_ vars set in beforeEach to test missing scenario
      vi.unstubAllEnvs();

      loadConfig(log, config);
      expect(config).toBeInstanceOf(Provider);

      // Set INPUT_ vars AFTER loadConfig to verify they're not picked up
      vi.stubEnv('INPUT_owner', 'testowner');
      vi.stubEnv('INPUT_REPO', 'testrepo');
      vi.stubEnv('INPUT_README', 'testreadme');
      vi.stubEnv('INPUT_ACTION', 'testaction');

      expect(() => loadRequiredConfig(log, config)).toThrowError(
        /Missing required keys: paths:action, paths:readme, owner, repo/,
      );
    });

    test('loadConfig transforms INPUT_ env vars to paths (GitHub Actions scenario)', ({ task }) => {
      // TDD test: This test replicates the actual GitHub Actions scenario
      // where INPUT_ACTION and INPUT_README environment variables are set
      // BEFORE loadConfig() is called.
      const log = new LogTask(task.name);
      const config = new Provider();

      // Set INPUT_ env vars BEFORE calling loadConfig (simulates GitHub Actions)
      vi.stubEnv('INPUT_ACTION', actTestYmlPath);
      vi.stubEnv('INPUT_README', readmeTestPath);

      // Load config with INPUT_ vars already set
      loadConfig(log, config);

      // Verify INPUT_ vars were transformed to paths:action and paths:readme
      expect(config.get('paths:action')).toBe(actTestYmlPath);
      expect(config.get('paths:readme')).toBe(readmeTestPath);
    });

    test('loadAction', ({ task }) => {
      const log = new LogTask(task.name);
      const result = loadAction(log, actTestYmlPath);
      expect(result).toBeInstanceOf(Action);
    });
  });
  describe('Test Inputs Class', () => {
    beforeEach(() => {
      // const { statSync, readFileSync, existsSync } =
      //   await vi.importActual<typeof import('../__mocks__/fs.js')>(fsMocksFile);
      // vi.mocked(fs.statSync).mockImplementation(statSync);
      // vi.mocked(fs.existsSync).mockImplementation(existsSync);
      // vi.mocked(fs.readFileSync).mockImplementation(readFileSync);
      vi.stubEnv('GITHUB_EVENT_PATH', payloadFile);
      vi.stubEnv('GITHUB_REPOSITORY', '');
      vi.stubEnv('INPUT_README', readmeTestPath);
      vi.stubEnv('INPUT_ACTION', actTestYmlPath);
    });
    afterEach(() => {
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });
    test('Inputs Constructor', async ({ task }) => {
      const log = new LogTask(task.name);
      const { default: Action } = await import('../src/Action.js');
      vi.stubEnv('DEBUG', 'true');
      const action = new Action(actTestYmlPath);
      const providedInputContext: InputContext = {
        readmePath: readmeTestPath,
        action,
        configPath: './.ghadocs.json',
        repo: 'testrepo',
        owner: 'testowner',
        sections: ['usage'],
        readmeEditor: new ReadmeEditor(readmeTestPath),
      };

      const inputs = new Inputs(providedInputContext, log);
      expect(inputs).toBeInstanceOf(Inputs);
    });

    // The point of --debug_config is that it prints; without this the wiring
    // could go inert again exactly as it was before, and nothing would notice.
    const constructWithConfig = async (log: LogTask, config?: Provider): Promise<void> => {
      const { default: Action } = await import('../src/Action.js');
      vi.stubEnv('DEBUG', 'true');

      new Inputs(
        {
          readmePath: readmeTestPath,
          action: new Action(actTestYmlPath),
          configPath: './.ghadocs.json',
          repo: 'testrepo',
          owner: 'testowner',
          sections: ['usage'],
          readmeEditor: new ReadmeEditor(readmeTestPath),
          ...(config ? { config } : {}),
        },
        log,
      );
    };

    const configWith = (key: string): Provider => {
      const config = new Provider();
      config.use('memory');
      config.set(key, true);
      return config;
    };

    test('constructor dumps the resolved config when debug:config is set', async ({ task }) => {
      const log = new LogTask(task.name);

      await constructWithConfig(log, configWith('debug:config'));

      expect(vi.mocked(log.info)).toHaveBeenCalledWith(expect.stringContaining('Resolved config:'));
    });

    test('constructor dumps the resolved config when debug:nconf is set', async ({ task }) => {
      const log = new LogTask(task.name);

      await constructWithConfig(log, configWith('debug:nconf'));

      expect(vi.mocked(log.info)).toHaveBeenCalledWith(expect.stringContaining('Resolved config:'));
    });

    test('constructor stays quiet when no debug flag is set', async ({ task }) => {
      const log = new LogTask(task.name);

      await constructWithConfig(log);

      expect(vi.mocked(log.info)).not.toHaveBeenCalledWith(
        expect.stringContaining('Resolved config:'),
      );
    });

    test('Inputs stringify', async ({ task }) => {
      const log = new LogTask(task.name);
      const { default: Action } = await import('../src/Action.js');

      // Clear beforeEach env vars and set test-specific ones
      vi.unstubAllEnvs();
      vi.stubEnv('DEBUG', 'true');
      vi.stubEnv('INPUT_OWNER', 'stringowner');
      vi.stubEnv('INPUT_REPO', 'stringrepo');
      vi.stubEnv('INPUT_README', 'stringreadme');
      vi.stubEnv('INPUT_ACTION', 'stringaction');
      vi.stubEnv('GITHUB_REPOSITORY', ''); // Prevent fallback
      vi.stubEnv('GITHUB_EVENT_PATH', ''); // Prevent payload file read

      const action = new Action(actTestYmlPath);
      const sections = ['usage'] as ReadmeSection[];
      const providedInputContext: InputContext = {
        action,
        sections,
        configPath: '/tmp/nonexistent.json', // Prevent loading .ghadocs.json
      };

      const inputs = new Inputs(providedInputContext, log);
      const result = inputs.stringify();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/owner: stringowner/);
      expect(result).toMatch(/repo: stringrepo/);
      expect(result).toMatch(/sections:\n {2}- usage/);
      expect(result).toMatch(/action: stringaction/);
      expect(result).toMatch(/readme: stringreadme/);
    });
  });
});
