import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { context as githubContext } from '@actions/github';
import { afterEach, beforeEach, describe, expect, it, test, vi } from 'vite-plus/test';

import {
  basename,
  columnHeader,
  getCurrentVersionString,
  indexOfRegex,
  lastIndexOfRegex,
  prefixParser,
  remoteGitUrlPattern,
  repositoryFinder,
  rowHeader,
  stripRefs,
  titlecase,
  undefinedOnEmpty,
  wrapText,
} from '../src/helpers.js';
import type Inputs from '../src/inputs.js';
import {
  actionTestString,
  ghadocsTestString,
  gitConfigTestString,
  payloadTestString,
} from './action.constants.js';

// Get Context type and constructor from the exported context instance
type Context = typeof githubContext;
const Context = githubContext.constructor as new () => Context;

// Mocking required objects and functions
vi.mock('node:fs', async () => {
  return import('../__mocks__/node:fs.js');
});
vi.mock('@actions/github');

let tempEnv: typeof process.env;

describe('test mocks work', () => {
  beforeEach(() => {
    tempEnv = { ...process.env };
    process.env.GITHUB_REPOSITORY = undefined;
    process.env.INPUT_OWNER = undefined;
    process.env.INPUT_REPO = undefined;
    process.env.INPUT_README = undefined;
    process.env.INPUT_ACTION = undefined;
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
  const payloadFile = path.join(import.meta.dirname, 'payload.json');
  beforeEach(() => {
    tempEnv = { ...process.env };
    process.env.GITHUB_REPOSITORY = undefined;
    process.env.INPUT_OWNER = undefined;
    process.env.INPUT_REPO = undefined;
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
      // Regex captures repo with .git suffix; the function strips it later
      expect(match?.groups?.repo).toBe('repo.git');
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

  describe('rowHeader', () => {
    it('should return empty string if the value is empty', () => {
      expect(rowHeader('')).toBe('');
    });

    it('should wrap the value in bold and code tags', () => {
      expect(rowHeader('my-input')).toBe('<b><code>my-input</code></b>');
    });

    it('should remove bold markdown formatting before wrapping', () => {
      expect(rowHeader('**bold-text**')).toBe('<b><code>bold-text</code></b>');
    });

    it('should remove italic markdown formatting before wrapping', () => {
      expect(rowHeader('*italic-text*')).toBe('<b><code>italic-text</code></b>');
    });

    it('should remove strikethrough markdown formatting before wrapping', () => {
      expect(rowHeader('~~strikethrough~~')).toBe('<b><code>strikethrough</code></b>');
    });

    it('should trim whitespace before wrapping', () => {
      expect(rowHeader('  spaced  ')).toBe('<b><code>spaced</code></b>');
    });
  });

  describe('columnHeader', () => {
    it('should return empty string if the value is empty', () => {
      expect(columnHeader('')).toBe('');
    });

    it('should return titlecased header', () => {
      expect(columnHeader('input')).toBe('Input');
    });

    it('should remove markdown formatting', () => {
      expect(columnHeader('**bold**')).toBe('Bold');
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
      // Regex captures repo with .git suffix, function strips it
      expect(resultRegExp?.groups).toEqual({
        owner: 'ownergit',
        repo: 'repogit.git',
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

  describe('getCurrentVersionString', () => {
    /**
     * Helper to create a mock Inputs object for testing version source
     */
    function createMockInputs(configValues: Record<string, unknown>): Inputs {
      return {
        config: {
          get: (key: string) => configValues[key],
        },
        action: {
          path: '/test/action.yml',
        },
      } as unknown as Inputs;
    }

    describe('version_source option', () => {
      it('should use git-tag as default version source', () => {
        const inputs = createMockInputs({
          'versioning:enabled': true,
          'versioning:source': undefined, // default should be git-tag
          'versioning:prefix': 'v',
        });

        // This test verifies the default behavior falls back to git-tag
        const result = getCurrentVersionString(inputs);
        // Without actual git, it should fall back to 0.0.0
        expect(result).toMatch(/^v/);
      });

      it('should return fallback for git-branch when git command fails', () => {
        // When git is not available (like in test env), it falls back to 0.0.0
        // but should NOT apply prefix for git-branch source
        const inputs = createMockInputs({
          'versioning:enabled': true,
          'versioning:source': 'git-branch',
          'versioning:prefix': 'v',
        });

        const result = getCurrentVersionString(inputs);
        // When git-branch fails, it falls back to 0.0.0 but without prefix
        expect(result).toBe('0.0.0');
      });

      it('should return fallback for git-sha when git command fails', () => {
        // When git is not available (like in test env), it falls back to 0.0.0
        // but should NOT apply prefix for git-sha source
        const inputs = createMockInputs({
          'versioning:enabled': true,
          'versioning:source': 'git-sha',
          'versioning:prefix': 'v',
        });

        const result = getCurrentVersionString(inputs);
        // When git-sha fails, it falls back to 0.0.0 but without prefix
        expect(result).toBe('0.0.0');
      });

      it('should use version_override in explicit mode', () => {
        const inputs = createMockInputs({
          'versioning:enabled': true,
          'versioning:source': 'explicit',
          'versioning:override': '1.0.0',
          'versioning:prefix': 'v',
        });

        const result = getCurrentVersionString(inputs);
        expect(result).toBe('v1.0.0');
      });

      it('should return v0.0.0 in explicit mode without override', () => {
        const inputs = createMockInputs({
          'versioning:enabled': true,
          'versioning:source': 'explicit',
          'versioning:override': '',
          'versioning:prefix': 'v',
        });

        const result = getCurrentVersionString(inputs);
        expect(result).toBe('v0.0.0');
      });

      it('should use branch name when versioning is disabled', () => {
        const inputs = createMockInputs({
          'versioning:enabled': false,
          'versioning:branch': 'main',
        });

        const result = getCurrentVersionString(inputs);
        expect(result).toBe('main');
      });

      it('should default to main when versioning is disabled without a branch', () => {
        const inputs = createMockInputs({
          'versioning:enabled': false,
        });

        const result = getCurrentVersionString(inputs);
        expect(result).toBe('main');
      });

      it('should default to main when versioning is disabled with an empty branch', () => {
        const inputs = createMockInputs({
          'versioning:enabled': false,
          'versioning:branch': '',
        });

        const result = getCurrentVersionString(inputs);
        expect(result).toBe('main');
      });

      it('should apply override even when not in explicit mode', () => {
        const inputs = createMockInputs({
          'versioning:enabled': true,
          'versioning:source': 'git-tag',
          'versioning:override': '2.0.0',
          'versioning:prefix': 'v',
        });

        const result = getCurrentVersionString(inputs);
        expect(result).toBe('v2.0.0');
      });

      it('should prefer the more specific tag when multiple tags point at the same commit', () => {
        // Regression test: `git describe --tags --abbrev=0`'s tie-break
        // between tags at zero distance from HEAD isn't guaranteed to
        // prefer the exact release tag (v1.11.0) over a floating major tag
        // (v1) also pointing at that commit - a real, reproducible layout
        // for any repo tagging releases the way this one does.
        const tempDir = execSync('mktemp -d', { encoding: 'utf8' }).trim();
        try {
          execSync('git init -q', { cwd: tempDir });
          execSync('git config user.email test@example.com', { cwd: tempDir });
          execSync('git config user.name test', { cwd: tempDir });
          execSync('git commit -q -m init --allow-empty', { cwd: tempDir });
          execSync('git tag v1.11.0', { cwd: tempDir });
          execSync('git tag v1', { cwd: tempDir });

          const inputs = {
            config: {
              get: (key: string) =>
                ({
                  'versioning:enabled': true,
                  'versioning:source': 'git-tag',
                  'versioning:prefix': 'v',
                })[key],
            },
            action: { path: path.join(tempDir, 'action.yml') },
          } as unknown as Inputs;

          const result = getCurrentVersionString(inputs);
          expect(result).toBe('v1.11.0');
        } finally {
          execSync(`rm -rf ${tempDir}`);
        }
      });

      it('should not let an unrelated co-located tag with more dots outrank a real version tag', () => {
        // Regression test: the most-specific-tag heuristic above counts
        // dot-separated segments, so an unrelated tag with more dots than
        // any real version tag (e.g. a release-notes marker) must not win
        // just because it has more segments.
        const tempDir = execSync('mktemp -d', { encoding: 'utf8' }).trim();
        try {
          execSync('git init -q', { cwd: tempDir });
          execSync('git config user.email test@example.com', { cwd: tempDir });
          execSync('git config user.name test', { cwd: tempDir });
          execSync('git commit -q -m init --allow-empty', { cwd: tempDir });
          execSync('git tag v1.11.0', { cwd: tempDir });
          execSync('git tag v1', { cwd: tempDir });
          execSync('git tag z.release.2026.08', { cwd: tempDir });

          const inputs = {
            config: {
              get: (key: string) =>
                ({
                  'versioning:enabled': true,
                  'versioning:source': 'git-tag',
                  'versioning:prefix': 'v',
                })[key],
            },
            action: { path: path.join(tempDir, 'action.yml') },
          } as unknown as Inputs;

          const result = getCurrentVersionString(inputs);
          expect(result).toBe('v1.11.0');
        } finally {
          execSync(`rm -rf ${tempDir}`);
        }
      });
    });
  });
});
