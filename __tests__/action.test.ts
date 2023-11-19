/* eslint-disable @typescript-eslint/unbound-method */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
import YAML from 'yaml';

import { actionTestString, actTestYmlPath } from './action.constants.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

vi.mock('node:fs');
vi.mock('../src/logtask/index.js');

let tempEnv: typeof process.env;

describe('Action', () => {
  let mockLogTask: InstanceType<typeof import('../src/logtask/index.js').default>;
  beforeEach(async () => {
    const { default: LogTask } = await import('../src/logtask/index.js');
    mockLogTask = new LogTask('mockAction');
    tempEnv = { ...process.env };
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.INPUT_OWNER;
    delete process.env.INPUT_REPO;
  });

  // restore the environment variables after each test
  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = tempEnv;
    // restore replaced property
    vi.restoreAllMocks();
  });

  describe('test mocks work', () => {
    test('Yaml parses correctly', () => {
      const y = YAML.parse(actionTestString);
      expect(y.name).toBe('Test Action');
    });
    test('LogTask.fail is mocked', () => {
      expect(vi.isMockFunction(mockLogTask.fail)).toBe(true);
      mockLogTask.fail('test');
      expect(mockLogTask.fail).toBeCalled();
      vi.mocked(mockLogTask.fail).mockImplementationOnce((msg) => {
        expect(msg).toBe('test1');
      });
      mockLogTask.fail('test1');
    });
    test('readFileSync is mocked', () => {
      expect(vi.isMockFunction(fs.readFileSync)).toBe(true);
      expect(fs.readFileSync(actTestYmlPath, 'utf8')).toBe(actionTestString);
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

  describe('constructor', () => {
    const errMsgFailedToLoad = `Failed to load ${actTestYmlPath}`;
    it(`should load and parse the ${actTestYmlPath} file`, async () => {
      const { default: Action } = await import('../src/Action.js');
      vi.stubEnv('DEBUG', 'true');
      const action = new Action(actTestYmlPath, mockLogTask);

      expect(fs.readFileSync).toHaveBeenCalledWith(actTestYmlPath, 'utf8');
      expect(action.name).toBe('Test Action');
      expect(action.author).toBe('Test Author');
      expect(action.description).toBe('Test Description');
      expect(action.branding).toEqual({ color: 'white', icon: 'activity' });
      expect(action.inputs).toEqual({
        input1: {
          description: 'Test Input 1',
          required: true,
          default: 'default1',
        },
        input2: {
          description: 'Test Input 2',
        },
      });
      expect(action.outputs).toEqual({
        output1: {
          description: 'Test Output 1',
        },
      });
      expect(action.runs).toEqual({
        using: 'container',
        image: 'test-image',
        main: 'test-main',
        pre: 'test-pre',
      });
    });

    it('should throw an error if failed to load action.yml', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error(errMsgFailedToLoad);
      });

      vi.mocked(mockLogTask.fail).mockImplementation((msg) => expect(msg).toBe(errMsgFailedToLoad));
      const { default: Action } = await import('../src/Action.js');

      expect(() => {
        return new Action(actTestYmlPath, mockLogTask);
      }).toThrowError(errMsgFailedToLoad);
      expect(fs.readFileSync).toHaveBeenCalledWith(actTestYmlPath, 'utf8');
    });

    it('should throw an error if action.yml is missing', async () => {
      const { default: Action } = await import('../src/Action.js');

      vi.mocked(fs.statSync).mockImplementation(
        (actionPath: fs.PathLike): fs.Stats | fs.BigIntStats | undefined => {
          const actionDir = path.dirname(path.resolve(actionPath as string));
          throw new Error(`${actionPath} does not exist in ${actionDir}`);
        },
      );
      vi.mocked(mockLogTask.fail).mockImplementation((msg) => expect(msg).toBe(errMsgFailedToLoad));

      expect(() => {
        return new Action(actTestYmlPath, mockLogTask);
      }).toThrowError(errMsgFailedToLoad);
      expect(fs.statSync).toHaveBeenCalledWith(actTestYmlPath);
    });

    it('should throw an error if action.yml is not a file', async () => {
      const { default: Action } = await import('../src/Action.js');
      const action = new Action(actTestYmlPath, mockLogTask);

      expect(action).toBeDefined();
      expect(fs.existsSync).toHaveBeenCalledWith(actTestYmlPath);
    });
  });

  describe('inputDefault', () => {
    it('should return the default value for an input', async () => {
      const { default: Action } = await import('../src/Action.js');
      const action = new Action(actTestYmlPath, mockLogTask);
      action.inputs = {
        input1: {
          description: 'input1 desc',
          default: 'default1',
        },
        input2: {
          description: 'input2 desc',
        },
      };

      expect(action.inputDefault('input1')).toBe('default1');
      expect(action.inputDefault('input2')).toBeUndefined();
      expect(action.inputDefault('input3')).toBeUndefined();
    });
  });

  describe('stringify', () => {
    it('should stringify the action to YAML', async () => {
      const { default: Action } = await import('../src/Action.js');
      const action = new Action(actTestYmlPath, mockLogTask);
      const yamlString = action.stringify();
      expect(yamlString).toContain('name: Test Action');
      expect(yamlString).toContain('author: Test Author');
      expect(yamlString).toContain('description: Test Description');
      expect(yamlString).toContain('color: white');
      expect(yamlString).toContain('icon: activity');
      expect(yamlString).toContain('input1:');
      expect(yamlString).toContain('description: Test Input 1');
      expect(yamlString).toContain('required: true');
      expect(yamlString).toContain('default: default1');
      expect(yamlString).toContain('input2:');
      expect(yamlString).toContain('description: Test Input 2');
      expect(yamlString).toContain('output1:');
      expect(yamlString).toContain('description: Test Output 1');
      expect(yamlString).toContain('using: container');
      expect(yamlString).toContain('image: test-image');
      expect(yamlString).toContain('main: test-main');
      expect(yamlString).toContain('pre: test-pre');
    });

    it('should throw an error if the YAML file is malformed', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => 'malformed yaml string');
      expect(fs.readFileSync('anything')).toBe('malformed yaml string');

      const { default: Action } = await import('../src/Action.js');
      expect(() => new Action(actTestYmlPath, mockLogTask)).toThrowError();
    });

    it('should return an empty string if failed to stringify', async () => {
      const { default: Action } = await import('../src/Action.js');
      const action = new Action(actTestYmlPath, mockLogTask);
      const logErrorSpy = vi.spyOn(action.log, 'error');
      vi.spyOn(YAML, 'stringify').mockImplementation(() => {
        throw new Error('Failed to stringify');
      });

      const yamlString = action.stringify();

      expect(yamlString).toBe('');
      expect(logErrorSpy).toHaveBeenCalledWith(
        'Failed to stringify Action. Error: Failed to stringify',
      );
    });
  });
});
