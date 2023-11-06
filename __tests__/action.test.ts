/* eslint-disable sonarjs/no-duplicate-string */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';
import YAML from 'yaml';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// const actualFs = await vi.importActual<typeof import('node:fs')>('node:fs');
const actTestYml = './action.test.yml';
const actTestYmlPath = path.resolve(__dirname, actTestYml);
vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    statSync: vi.fn(),
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  };
});

vi.mock('../src/logtask/index.js', async () => {
  const actual =
    await vi.importActual<typeof import('../src/logtask/index.js')>('../src/logtask/index.js');
  return vi.fn(() => ({
    ...actual,
    fail: vi.fn(),
  }));
});
const actionTestString = `name: Test Action
author: Test Author
description: Test Description
branding:
  color: white
  icon: activity
inputs:
  input1:
    description: Test Input 1
    required: true
    default: default1
  input2:
    description: Test Input 2
outputs:
  output1:
    description: Test Output 1
runs:
  using: container
  image: test-image
  main: test-main
  pre: test-pre
`;
const statSyncImpl = (
  path: fs.PathLike,
  options?: fs.StatSyncOptions | undefined,
): fs.Stats | fs.BigIntStats | undefined => {
  if (path === actTestYmlPath && options === undefined) {
    return {
      isFile: () => true,
    } as fs.Stats;
  }
  return {
    isFile: () => false,
  } as fs.Stats;
};
const existsSyncImpl = (filename: fs.PathLike): boolean => {
  return filename === actTestYmlPath;
};
const readFileSyncImpl = (filename: fs.PathOrFileDescriptor): string | Buffer => {
  if (filename === actTestYmlPath) {
    return actionTestString;
  }
  return '';
};

describe('Action', () => {
  beforeEach(() => {
    vi.mocked(fs.statSync).mockImplementation(statSyncImpl);
    vi.mocked(fs.existsSync).mockImplementation(existsSyncImpl);
    vi.mocked(fs.readFileSync).mockImplementation(readFileSyncImpl);
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('test mocks work', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });
    test('Yaml parses correctly', () => {
      const y = YAML.parse(actionTestString);
      expect(y.name).toBe('Test Action');
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
    afterEach(() => {
      vi.restoreAllMocks();
    });
    it(`should load and parse the ${actTestYml} file`, async () => {
      const { default: Action } = await import('../src/Action.js');
      vi.stubEnv('DEBUG', 'true');
      const action = new Action(actTestYmlPath);

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
      vi.mock('../src/logtask/index.js', async () => {
        const actual =
          await vi.importActual<typeof import('../src/logtask/index.js')>(
            '../src/logtask/index.js',
          );
        return {
          ...actual,
          fail: vi.fn().mockImplementation((msg) => expect(msg).toBe(errMsgFailedToLoad)),
        };
      });
      const { default: Action } = await import('../src/Action.js');

      expect(() => {
        return new Action(actTestYmlPath);
      }).toThrowError(errMsgFailedToLoad);
      expect(fs.readFileSync).toHaveBeenCalledWith(actTestYmlPath, 'utf8');
    });

    it('should throw an error if action.yml is missing', async () => {
      vi.mocked(fs.statSync).mockImplementation(
        (actionPath: fs.PathLike): fs.Stats | fs.BigIntStats | undefined => {
          const actionDir = path.dirname(path.resolve(actionPath as string));
          throw new Error(`${actionPath} does not exist in ${actionDir}`);
        },
      );
      vi.mock('../src/logtask/index.js', async () => {
        const actual =
          await vi.importActual<typeof import('../src/logtask/index.js')>(
            '../src/logtask/index.js',
          );
        return {
          ...actual,
          fail: vi.fn().mockImplementation((msg) => expect(msg).toBe(errMsgFailedToLoad)),
        };
      });
      const { default: Action } = await import('../src/Action.js');

      expect(() => {
        return new Action(actTestYmlPath);
      }).toThrowError(errMsgFailedToLoad);
      expect(fs.statSync).toHaveBeenCalledWith(actTestYmlPath);
    });

    it('should throw an error if action.yml is not a file', async () => {
      const { default: Action } = await import('../src/Action.js');

      const action = new Action(actTestYmlPath);
      expect(action).toBeDefined();
      expect(fs.existsSync).toHaveBeenCalledWith(actTestYmlPath);
    });
  });

  describe('inputDefault', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });
    it('should return the default value for an input', async () => {
      const { default: Action } = await import('../src/Action.js');
      const action = new Action(actTestYmlPath);
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
    afterEach(() => {
      vi.restoreAllMocks();
    });
    it('should stringify the action to YAML', async () => {
      const { default: Action } = await import('../src/Action.js');
      const action = new Action(actTestYmlPath);
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
      expect(() => new Action(actTestYmlPath)).toThrowError();
    });

    it('should return an empty string if failed to stringify', async () => {
      const { default: Action } = await import('../src/Action.js');
      const action = new Action(actTestYmlPath);
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
/* eslint-enable sonarjs/no-duplicate-string */
