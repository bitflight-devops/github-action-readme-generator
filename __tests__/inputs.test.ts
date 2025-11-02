import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Provider } from 'nconf';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import YAML from 'yaml';

import Action from '../src/Action.js';
import { ReadmeSection } from '../src/constants.js';
import Inputs, {
  collectAllDefaultValuesFromAction,
  InputContext,
  loadAction,
  loadConfig,
  loadDefaultConfig,
  loadRequiredConfig,
  setConfigValueFromActionFileDefault,
  transformGitHubInputsToArgv,
} from '../src/inputs.js';
import LogTask from '../src/logtask/index.js';
import ReadmeEditor from '../src/readme-editor.js';
import { actionTestString } from './action.constants.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// Mocking required objects and functions
vi.mock('node:fs', async () => {
  const mockFs = await import('../__mocks__/node:fs.js');
  return mockFs;
});
vi.mock('@actions/core');
vi.mock('../src/Action.js');
vi.mock('../src/constants.js');
vi.mock('../src/logtask/index.js');
vi.mock('../src/readme-editor.js');

describe('inputs', () => {
  const readmeTestPath = './README.test.md';
  const actTestYmlPath = './action.test.yml';
  // const fsMocksFile = './mocks/fs.js';
  const payloadFile = path.join(__dirname, 'payload.json');

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

    test('loadConfig', ({ task }) => {
      const log = new LogTask(task.name);
      const providedConfig = new Provider();
      const configFilePath = './configFile';

      const result = loadConfig(log, providedConfig, configFilePath);
      expect(result).toBeInstanceOf(Provider);
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
        delete process.env.INPUT_USER;
        delete process.env.INPUT_REPO;
        const log = new LogTask(task.name);
        const config = new Provider();
        const result = loadDefaultConfig(log, config);
        expect(result.get('owner')).toBe('user2');
        expect(result.get('repo')).toBe('test2');
      });
      test('loadDefaultConfig from provided context payload', ({ task }) => {
        delete process.env.INPUT_USER;
        delete process.env.INPUT_REPO;
        delete process.env.GITHUB_REPOSITORY;
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
      loadConfig(log, config);
      expect(config).toBeInstanceOf(Provider);
      vi.stubEnv('INPUT_owner', 'testowner');
      vi.stubEnv('INPUT_REPO', 'testrepo');
      vi.stubEnv('INPUT_README', 'testreadme');
      vi.stubEnv('INPUT_ACTION', 'testaction');

      expect(() => loadRequiredConfig(log, config)).toThrowError(
        /Missing required keys: paths:action, paths:readme, owner, repo/,
      );
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

    test('Inputs stringify', async ({ task }) => {
      const log = new LogTask(task.name);
      const { default: Action } = await import('../src/Action.js');
      vi.stubEnv('DEBUG', 'true');
      const action = new Action(actTestYmlPath);
      const sections = ['usage'] as ReadmeSection[];
      vi.stubEnv('INPUT_OWNER', 'stringowner');
      vi.stubEnv('INPUT_REPO', 'stringrepo');
      vi.stubEnv('INPUT_README', 'stringreadme');
      vi.stubEnv('INPUT_ACTION', 'stringaction');
      const providedInputContext: InputContext = {
        action,
        sections,
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
