import * as fs from 'node:fs';

import { context } from '@actions/github';
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

vi.mock('@actions/github');

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    readFileSync: vi
      .fn()
      .mockReturnValue(`[remote "origin"]\nurl = https://github.com/owner/repo.git\n`),
  };
});

let tempEnv: typeof process.env;
beforeEach(() => {
  tempEnv = { ...process.env };
  process.env.GITHUB_REPOSITORY = undefined;
  process.env.INPUT_OWNER = undefined;
  process.env.INPUT_REPO = undefined;
});

// restore the environment variables after each test
afterEach(() => {
  vi.unstubAllEnvs();
  process.env = tempEnv;
  // restore replaced property
  vi.restoreAllMocks();
});
describe('test mocks work', () => {
  test('readFileSync is mocked', () => {
    expect(vi.isMockFunction(fs.readFileSync)).toBe(true);
  });
});

describe('helpers', () => {
  describe('Test constants', () => {
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
    it('should return the repository information from the input', () => {
      const result = repositoryFinder('owner/repo', null);
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return the repository information from the GitHub context', () => {
      vi.spyOn(context, 'repo', 'get').mockReturnValue({ owner: 'owner', repo: 'repo' });
      const result = repositoryFinder(null, context);
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return the repository information from the environment variables', () => {
      vi.stubEnv('GITHUB_REPOSITORY', 'owner/repo');
      const result = repositoryFinder(null, null);
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return the repository information from the inputs variables', () => {
      vi.stubEnv('INPUT_OWNER', 'owner');
      vi.stubEnv('INPUT_REPO', 'repo');
      const result = repositoryFinder(null, null);
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });

    it('should return the repository information from the git configuration', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        return `[remote "origin"]\nurl = https://github.com/owner/repo.git\n`;
      });
      const result = repositoryFinder(null, null);
      expect(fs.readFileSync).toHaveBeenCalled();
      expect(result).toEqual({ owner: 'owner', repo: 'repo' });
    });
  });
  describe('indexOfRegex and lastIndexOfRegex', () => {
    const str = 'Hello, World!';
    const regex = /o/g;

    test('indexOfRegex should return the correct index', () => {
      expect(indexOfRegex(str, regex)).toBe(4);
      expect(indexOfRegex(str, regex, 5)).toBe(8);
      expect(indexOfRegex(str, /z/g)).toBe(-1);
    });

    test('lastIndexOfRegex should return the correct index', () => {
      expect(lastIndexOfRegex(str, regex)).toBe(8);
      expect(lastIndexOfRegex(str, regex, 7)).toBe(4);
      expect(lastIndexOfRegex(str, /z/g)).toBe(-1);
    });
  });
});
