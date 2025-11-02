import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Context } from '@actions/github/lib/context.js';
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vitest';

import {
  basename,
  indexOfRegex,
  lastIndexOfRegex,
  prefixParser,
  remoteGitUrlPattern,
  repositoryFinder,
  stripRefs,
  titlecase,
  undefinedOnEmpty,
  wrapText,
} from '../src/helpers.js';
import {
  actionTestString,
  ghadocsTestString,
  gitConfigTestString,
  payloadTestString,
} from './action.constants.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// Mocking required objects and functions
vi.mock('node:fs', async () => {
  const mockFs = await import('../__mocks__/node:fs.js');
  return mockFs;
});
vi.mock('@actions/github');

let tempEnv: typeof process.env;

describe('test mocks work', () => {
  beforeEach(() => {
    tempEnv = { ...process.env };
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.INPUT_OWNER;
    delete process.env.INPUT_REPO;
    delete process.env.INPUT_README;
    delete process.env.INPUT_ACTION;
  });

  // restore the environment variables after each test
  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = tempEnv;
    // restore replaced property
    vi.restoreAllMocks();
  });
  test('readFileSync is mocked', () => {
    expect(vi.isMockFunction(fs.readFileSync)).toBe(true);
    expect(fs.readFileSync('payload.json', 'utf8')).toBe(payloadTestString);
    expect(fs.readFileSync('action.yml', 'utf8')).toBe(actionTestString);
    expect(fs.readFileSync('.git/config', 'utf8')).toBe(gitConfigTestString);
    expect(fs.readFileSync('.ghadocs.json', 'utf8')).toBe(ghadocsTestString);
    expect(fs.readFileSync('test', 'utf8')).toBe('');
  });
});

describe('helpers', () => {
  const readmeTestPath = './README.test.md';
  const actTestYmlPath = './action.test.yml';
  const payloadFile = path.join(__dirname, 'payload.json');
  beforeEach(() => {
    tempEnv = { ...process.env };
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.INPUT_OWNER;
    delete process.env.INPUT_REPO;
    vi.stubEnv('GITHUB_EVENT_PATH', payloadFile);
    vi.stubEnv('GITHUB_REPOSITORY', '');
    vi.stubEnv('INPUT_README', readmeTestPath);
    vi.stubEnv('INPUT_ACTION', actTestYmlPath);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = tempEnv;
    // restore replaced property
    vi.restoreAllMocks();
  });

  describe('Test constants', () => {
    // restore the environment variables after each test

    test('regex', () => {
      const filePath = '/path/to/file.txt';
      const githubConfigOutput = `[remote "origin"]\nurl = https://github.com/owner/repo.git\n`;
      expect(vi.isMockFunction(fs.readFileSync)).toBe(true);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        return `[remote "origin"]\nurl = https://github.com/owner/repo.git\n`;
      });
      const output = fs.readFileSync(filePath, 'utf8');
      expect(fs.readFileSync).toBeCalled();
      expect(output).toBe(githubConfigOutput);
      const match = remoteGitUrlPattern.exec(output);
      expect(match).toBeDefined();
      expect(match?.groups).toBeDefined();
      expect(match?.groups?.owner).toBe('owner');
      expect(match?.groups?.repo).toBe('repo');
    });
  });

  describe('undefinedOnEmpty', () => {
    it('should return undefined if the value is empty', () => {
      const result = undefinedOnEmpty('');
      expect(result).toBeUndefined();
    });

    it('should return the value if it is not empty', () => {
      const result = undefinedOnEmpty('test');
      expect(result).toBe('test');
    });
  });

  describe('basename', () => {
    it('should return undefined if the path is empty', () => {
      const result = basename('');
      expect(result).toBeUndefined();
    });

    it('should return the basename of the path', () => {
      const result = basename('/path/to/file.txt');
      expect(result).toBe('file.txt');
    });
  });

  describe('stripRefs', () => {
    it('should return null if the path is empty', () => {
      const result = stripRefs('');
      expect(result).toBeNull();
    });

    it('should remove the "refs/heads/" prefix from the path', () => {
      const result = stripRefs('refs/heads/branch');
      expect(result).toBe('branch');
    });

    it('should remove the "refs/tags/" prefix from the path', () => {
      const result = stripRefs('refs/tags/tag');
      expect(result).toBe('tag');
    });
  });

  describe('titlecase', () => {
    it('should return undefined if the text is empty', () => {
      const result = titlecase('');
      expect(result).toBeUndefined();
    });

    it('should convert the text to title case', () => {
      const result = titlecase('hello world');
      // eslint-disable-next-line sonarjs/no-duplicate-string
      expect(result).toBe('Hello World');
    });

    it('should throw a TypeError if the input is not a string', () => {
      expect(() => {
        // @ts-expect-error testing wrong argument type
        titlecase(1);
      }).toThrow(TypeError);
    });
  });

  describe('prefixParser', () => {
    it('should return undefined if the text is empty', () => {
      const result = prefixParser('');
      expect(result).toBeUndefined();
    });

    it('should parse the text and convert it to title case', () => {
      const result = prefixParser('hello_world');
      expect(result).toBe('Hello World');
    });

    it('should replace underscores and dashes with spaces', () => {
      const result = prefixParser('hello-world');
      expect(result).toBe('Hello World');
    });

    it('should throw a TypeError if the input is not a string', () => {
      expect(() => {
        // @ts-expect-error testing wrong argument type
        prefixParser(1);
      }).toThrow(TypeError);
    });
  });

  describe('wrapText', () => {
    it('should return the content array if the text is empty', () => {
      const content = ['line 1', 'line 2'];
      const result = wrapText('', content);
      expect(result).toEqual(content);
    });

    it('should wrap the text into multiple lines with a maximum width of 80 characters', () => {
      const content: string[] = [];
      const result = wrapText(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod ultricies mi, nec convallis nisi. Donec pulvinar vestibulum tellus, in posuere ex. Sed eget semper ipsum.',
        content,
      );
      expect(result).toEqual([
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod ultricies',
        'mi, nec convallis nisi. Donec pulvinar vestibulum tellus, in posuere ex. Sed',
        'eget semper ipsum.',
      ]);
    });

    it('should prepend the given string to each wrapped line', () => {
      const content: string[] = [];
      const result = wrapText(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod ultricies mi, nec convallis nisi.',
        content,
        '> ',
      );
      expect(result).toEqual([
        '> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod ultricies',
        '> mi, nec convallis nisi.',
      ]);
    });
  });

  describe('repositoryFinder', () => {
    afterEach(() => {
      // Clean up environment variables and mocks after each test
      vi.unstubAllEnvs();
      vi.resetAllMocks();
    });

    it('should return the repository information from the input', () => {
      const result = repositoryFinder('ownerInput/repoInput', null);
      expect(result).toEqual({ owner: 'ownerInput', repo: 'repoInput' });
    });

    it('should return the repository information from the GitHub context', async () => {
      const context = new Context();
      vi.spyOn(context, 'repo', 'get').mockReturnValue({
        owner: 'ownercontext',
        repo: 'repocontext',
      });
      const result = repositoryFinder(null, context);
      expect(result).toEqual({ owner: 'ownercontext', repo: 'repocontext' });
    });

    it('should return the repository information from the GITHUB_REPOSITORY env var', () => {
      vi.stubEnv('GITHUB_REPOSITORY', 'owner5/repo5');
      vi.stubEnv('INPUT_OWNER', '');
      vi.stubEnv('INPUT_REPO', '');
      const context = new Context();
      const result = repositoryFinder(null, context);
      expect(result).toEqual({ owner: 'owner5', repo: 'repo5' });
    });

    it('should return the repository information from the inputs variables', () => {
      vi.stubEnv('GITHUB_REPOSITORY', '');
      vi.stubEnv('INPUT_OWNER', 'owner1');
      vi.stubEnv('INPUT_REPO', 'repo1');
      const result = repositoryFinder(`${process.env.INPUT_OWNER}/${process.env.INPUT_REPO}`, null);
      expect(result).toEqual({ owner: 'owner1', repo: 'repo1' });
    });

    it('should return the repository information from the git configuration', () => {
      vi.stubEnv('INPUT_OWNER', '');
      vi.stubEnv('INPUT_REPO', '');
      vi.stubEnv('GITHUB_REPOSITORY', '');

      const resultRegExp = remoteGitUrlPattern.exec(gitConfigTestString);
      expect(resultRegExp?.groups).toEqual({
        owner: 'ownergit',
        repo: 'repogit',
      });
      const result = repositoryFinder(null, null);
      expect(vi.isMockFunction(fs.readFileSync)).toBe(true);
      expect(fs.readFileSync).toHaveBeenCalledWith('.git/config', 'utf8');
      expect(result).toEqual({ owner: 'ownergit', repo: 'repogit' });
    });
  });

  describe('indexOfRegex and lastIndexOfRegex', () => {
    const str = 'Hello, World!';
    const regex = /llo/g;

    test('indexOfRegex should return the correct index', () => {
      expect(indexOfRegex(str, regex)).toBe(2);
      expect(indexOfRegex(str, /z/g)).toBe(-1);
    });

    test('lastIndexOfRegex should return the correct index', () => {
      expect(lastIndexOfRegex(str, regex)).toBe(5);
      expect(lastIndexOfRegex(str, /z/g)).toBe(-1);
    });
  });
});
