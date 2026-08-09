import { execFileSync, execSync } from 'node:child_process';
import { accessSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

// biome-ignore lint/style/useImportType: context is imported as a value to derive the type using typeof
import { context } from '@actions/github';
import type { PackageJson } from 'types-package-json';

import type Inputs from './inputs.js';
import LogTask from './logtask/index.js';
import { unicodeWordMatch } from './unicode-word-match.js';
import { type Nullable, notEmpty } from './util.js';

// Type alias for Context from the exported context instance
type Context = typeof context;
/**
 * Returns the input value if it is not empty, otherwise returns undefined.
 * @param value - The input value to check.
 * @returns The input value if it is not empty, otherwise undefined.
 */
export function undefinedOnEmpty(value: string | undefined): string | undefined {
  if (!value || value === '') {
    return undefined;
  }
  return value;
}

/**
 * Returns the basename of the given path.
 * @param pathStr - The path to extract the basename from.
 * @returns The basename of the path.
 */
export function basename(pathStr: string): string | undefined {
  if (!pathStr) {
    return undefined;
  }
  const log = new LogTask('basename');
  const result = path.basename(pathStr);
  log.debug(`Basename passed ${pathStr} and returns ${result}`);
  return result;
}
/**
 * Removes the "refs/heads/" or "refs/tags/" prefix from the given path.
 *
 * @param pathStr - The path to remove the prefix from
 * @returns The path without the prefix, or null if path is empty
 */
export function stripRefs(pathStr: string): string | null {
  if (!pathStr) {
    return null;
  }
  const log = new LogTask('stripRefs');
  const result = pathStr.replace('refs/heads/', '').replace('refs/tags/', '');
  log.debug(`stripRefs passed ${pathStr} and returns ${result}`);
  return result;
}

/**
 * Converts the given text to title case.
 * @param text - The text to convert.
 * @returns The text converted to title case.
 * @throws {TypeError} If the input is not a string.
 */
export function titlecase(text: string): string | undefined {
  if (!text) {
    return undefined;
  }
  if (typeof text !== 'string') {
    throw new TypeError(`Invalid argument type provided to titlecase(): ${typeof text}`);
  }
  return text.replaceAll(unicodeWordMatch, (txt) =>
    txt[0] ? txt[0].toUpperCase() + txt.slice(1).toLowerCase() : txt,
  );
}

/**
 * Parses the given text and converts it to title case, replacing underscores and dashes with spaces.
 * @param text - The text to parse and convert.
 * @returns The parsed text converted to title case.
 */
export function prefixParser(text: string | undefined): string | undefined {
  if (!text) {
    return undefined;
  }
  if (typeof text !== 'string') {
    throw new TypeError(`Invalid argument type provided to prefixParser(): ${typeof text}`);
  }
  return titlecase(text.replace(/[_-]+/, ' '));
}

/**
 * Wraps the given text into multiple lines with a maximum width of 80 characters.
 * @param text - The text to wrap.
 * @param content - The array to store the wrapped lines.
 * @param prepend - The string to prepend to each wrapped line.
 * @returns The array of wrapped lines.
 */
export function wrapText(
  text: string | undefined,
  content: string[],
  prepend: string = '',
): string[] {
  // Constrain the width of the description
  if (!text) {
    return content;
  }
  const width = 80;

  let description = text
    .trim()
    .replaceAll('\r\n', '\n') // Convert CR to LF
    .replaceAll(/ +/g, ' ') //    Squash consecutive spaces
    .replaceAll(' \n', '\n'); //  Squash space followed by newline

  while (description) {
    // Longer than width? Find a space to break apart
    let segment: string;
    if (description.length > width) {
      segment = description.slice(0, Math.max(0, width + 1));
      while (!segment.endsWith(' ') && !segment.endsWith('\n') && segment) {
        segment = segment.slice(0, Math.max(0, segment.length - 1));
      }

      // Trimmed too much?
      if (segment.length < width * 0.67) {
        segment = description;
      }
    } else {
      segment = description;
    }

    // Check for newline
    const newlineIndex = segment.indexOf('\n');
    if (newlineIndex >= 0) {
      segment = segment.slice(0, Math.max(0, newlineIndex + 1));
    }
    content.push(`${prepend}${segment}`.trimEnd());
    // Remaining
    description = description.slice(segment.length);
  }
  return content;
}

/**
 * Represents a repository with owner and repo properties.
 */
export interface Repo {
  owner: string;
  repo: string;
}

export function readFile(filename: string): string {
  try {
    return readFileSync(filename, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read file ${filename}: ${String(error)}`);
  }
}

export function repoObjFromRepoName(
  repository: Nullable<string>,
  log: LogTask,
  from?: string,
): Nullable<Repo> {
  if (notEmpty(repository)) {
    const [owner, repo] = repository.split('/');
    if (owner && repo) {
      log.debug(`repoObjFromRepoName using ${from} and returns ${JSON.stringify({ owner, repo })}`);
      return { owner, repo };
    }
  }
  return undefined;
}
// Pattern to match GitHub remote URLs in .git/config
// Handles both HTTPS (github.com/) and SSH (github.com:) formats
// Captures the repo name with or without .git suffix - suffix is stripped in code
export const remoteGitUrlPattern: RegExp =
  /url\s*=\s*.*github\.com[/:](?<owner>[^/\s]+)\/(?<repo>[^\s]+)/;
/**
 * Finds the repository information from the input, context, environment variables, or git configuration.
 * @param inputRepo - The input repository string.
 * @param context - The GitHub context object.
 * @param baseDir - Optional base directory to look for .git/config (defaults to CWD).
 * @returns The repository information (owner and repo) or null if not found.
 */
export function repositoryFinder(
  inputRepo: Nullable<string>,
  context: Nullable<Context>,
  baseDir?: string,
): Repo | null {
  const log = new LogTask('repositoryFinder');
  /**
   * Attempt to get git user and repo from input
   */
  const repoObj = repoObjFromRepoName(inputRepo, log, 'inputRepo');

  if (repoObj) {
    return repoObj;
  }

  /**
   * When baseDir is provided, prioritize .git/config from that directory
   * This is critical for external repos where GITHUB_REPOSITORY points to
   * the workflow repo, not the target repo being documented
   */
  if (baseDir) {
    try {
      const gitConfigPath = path.join(baseDir, '.git', 'config');
      const fileContent = readFile(gitConfigPath);
      log.debug(`Reading git config from: ${gitConfigPath}`);
      const results = remoteGitUrlPattern.exec(fileContent);
      if (results?.groups?.owner && results?.groups?.repo) {
        // Strip .git suffix if present (actions/checkout may or may not include it)
        const repo = results.groups.repo.replace(/\.git$/, '');
        log.debug(
          `repositoryFinder using '${gitConfigPath}' and returns ${JSON.stringify({ owner: results.groups.owner, repo })}`,
        );
        return {
          owner: results.groups.owner,
          repo,
        };
      } else {
        log.debug(`No remote URL found in ${gitConfigPath}`);
      }
    } catch (error) {
      log.debug(`Couldn't read .git/config from baseDir ${baseDir}: ${String(error)}`);
      // Fall through to other methods
    }
  }

  /**
   * Attempt to get git user and repo from GitHub context,
   * which includes checking for GITHUB_REPOSITORY environment variable
   */
  if (context) {
    try {
      const result = { ...context.repo };
      if (result.owner && result.repo) {
        log.debug(`repositoryFinder using GitHub context and returns ${JSON.stringify(result)}`);
        return result;
      }
    } catch (error) {
      log.debug(`repositoryFinder using GitHub context gives error ${JSON.stringify(error)}`);
    }
  }

  /**
   * Fallback: Try to parse GITHUB_REPOSITORY environment variable directly
   * This handles cases where the Context class doesn't pick up the value
   */
  const githubRepo = process.env.GITHUB_REPOSITORY;
  if (githubRepo) {
    const repoFromEnv = repoObjFromRepoName(githubRepo, log, 'GITHUB_REPOSITORY env');
    if (repoFromEnv) {
      return repoFromEnv;
    }
  }

  /**
   * Last resort: Attempt to get git user and repo from .git/config in CWD
   */
  try {
    const fileContent = readFile('.git/config');
    log.debug('Reading git config from: .git/config');
    const results = remoteGitUrlPattern.exec(fileContent);
    if (results?.groups?.owner && results?.groups?.repo) {
      // Strip .git suffix if present
      const repo = results.groups.repo.replace(/\.git$/, '');
      log.debug(
        `repositoryFinder using '.git/config' and returns ${JSON.stringify({ owner: results.groups.owner, repo })}`,
      );
      return {
        owner: results.groups.owner,
        repo,
      };
    } else {
      log.debug('No remote URL found in .git/config');
    }
  } catch (error) {
    // can't find it
    log.error(`Couldn't retrieve owner or repo in .git/config file: ${String(error)}`);
  }
  throw new Error('No owner or repo found');
}

/**
 * Returns the default branch of the git repository.
 * @returns The default branch.
 */
/**
 * Gets the default branch for the Git repository.
 *
 * @returns The name of the default branch.
 */
export function getDefaultGitBranch(): string {
  let result: Buffer | undefined;
  try {
    // Run git command to get default branch
    result = execSync('git symbolic-ref HEAD | sed s@^refs/heads/@@');
  } catch (error) {
    // If command fails, try alternative for MacOS
    if (error) {
      try {
        result = execSync(
          "git remote set-head origin -a;git remote show origin | head 50 sed -n 's/^.*default branch \\(.*\\)/\\1/p'",
        );
      } catch {
        result = execSync(
          "git remote set-head origin -a;git remote show origin | sed -n 's/^s*HEAD branch: \\(.*\\)/\\1/p'",
        );
      }
    }
  }
  return result?.toString().trim() ?? '';
}

/**
 * Formats the given value as a column header.
 * @param value - The value to format.
 * @returns The formatted column header.
 */
export function columnHeader(value: string): string {
  if (!value) {
    return '';
  }
  let text: string = value.replaceAll(/\*\*(.*?)\*\*/g, '$1');

  // Remove italic formatting: *italic*
  text = text.replaceAll(/\*(.*?)\*/g, '$1');

  // Remove strikethrough formatting: ~~strikethrough~~
  text = text.replaceAll(/~~(.*?)~~/g, '$1');

  const normalisedHeader = titlecase(text.trim());
  if (normalisedHeader) {
    return `${normalisedHeader}`;
  }
  return '';
}
/**
 * Formats the given value as a row header in HTML.
 *
 * Removes formatting from the string and converts it to bold code style.
 *
 * @param value - The string to format as a header
 * @returns The formatted row header string wrapped in bold and code tags
 */
export function rowHeader(value: string): string {
  if (!value) {
    return '';
  }

  let text = value;

  // Remove bold formatting
  text = text.replaceAll(/\*\*(.*?)\*\*/g, '$1');

  // Remove italic formatting: *italic*
  text = text.replaceAll(/\*(.*?)\*/g, '$1');

  // Remove strikethrough formatting: ~~strikethrough~~
  text = text.replaceAll(/~~(.*?)~~/g, '$1');

  // Normalize spacing
  text = text.trim();

  // Add bold and code formatting
  return `<b><code>${text}</code></b>`;
}

/**
 * Picks the most specific tag out of several tags pointing at the same commit.
 *
 * A release typically carries both an exact tag (`v1.11.0`) and a floating
 * major tag (`v1`) on the same commit, and `git describe --tags --abbrev=0`'s
 * tie-break between tags at zero distance isn't guaranteed to prefer the
 * exact one. Sort by dot-separated segment count, then by length, so
 * `v1.11.0` outranks `v1`.
 */
function mostSpecificTag(tags: string[]): string {
  const specificity = (tag: string) => tag.replace(/^v/, '').split('.').length;
  return [...tags].sort((a, b) => specificity(b) - specificity(a) || b.length - a.length)[0]!;
}

/**
 * Gets the version from git tags.
 */
function getVersionFromGitTag(actionDir: string, log: LogTask): string | undefined {
  try {
    // `git describe` finds the nearest tag by commit-graph distance, which
    // `git tag --points-at` alone can't do (it only ever matches exact
    // commits) - HEAD is usually several commits past the last release, not
    // on the tagged commit itself.
    const nearestTag = execSync(
      'git describe --tags --abbrev=0 2>/dev/null || git tag -l "v*" --sort=-v:refname | head -1',
      {
        cwd: actionDir,
        encoding: 'utf8',
      },
    ).trim();

    let gitVersion = nearestTag;
    if (nearestTag) {
      // The tag `git describe` picked may not be the most specific one:
      // a release commit typically carries both an exact tag (v1.11.0) and
      // a floating major tag (v1) pointing at the same commit, and
      // `git describe`'s tie-break at zero distance isn't guaranteed to
      // prefer the exact one. Re-resolve every tag on that same commit and
      // pick the most specific. execFileSync (not execSync with a
      // string-interpolated command) so a tag name containing shell
      // metacharacters can't be interpreted by a shell.
      const tagsOnSameCommit = execFileSync('git', ['tag', '--points-at', nearestTag], {
        cwd: actionDir,
        encoding: 'utf8',
      })
        .trim()
        .split('\n')
        .filter(Boolean);
      if (tagsOnSameCommit.length > 0) {
        gitVersion = mostSpecificTag(tagsOnSameCommit);
      }
    }

    if (gitVersion) {
      // Remove 'v' prefix if present for consistency, we'll add it back with the configured prefix
      const version = gitVersion.replace(/^v/, '');
      log.debug(`version from git tags: ${version}`);
      return version;
    }
  } catch {
    log.debug(`Could not get version from git tags in ${actionDir}`);
  }
  return undefined;
}

/**
 * Gets the current git branch name.
 */
function getVersionFromGitBranch(actionDir: string, log: LogTask): string | undefined {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: actionDir,
      encoding: 'utf8',
    }).trim();
    if (branch && branch !== 'HEAD') {
      log.debug(`version from git branch: ${branch}`);
      return branch;
    }
  } catch {
    log.debug(`Could not get branch name in ${actionDir}`);
  }
  return undefined;
}

/**
 * Gets the current git commit SHA (short form).
 */
function getVersionFromGitSha(actionDir: string, log: LogTask): string | undefined {
  try {
    const sha = execSync('git rev-parse --short HEAD', {
      cwd: actionDir,
      encoding: 'utf8',
    }).trim();
    if (sha) {
      log.debug(`version from git sha: ${sha}`);
      return sha;
    }
  } catch {
    log.debug(`Could not get commit SHA in ${actionDir}`);
  }
  return undefined;
}

/**
 * Gets the version from package.json.
 */
function getVersionFromPackageJson(actionDir: string, log: LogTask): string | undefined {
  const packageJsonPath = path.join(actionDir, 'package.json');
  log.debug(`Looking for package.json at: ${packageJsonPath}`);
  try {
    accessSync(packageJsonPath);
    const packageData: Partial<PackageJson> = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    const version = packageData.version;
    log.debug(`version from package.json: ${version ?? 'not found'}`);
    return version;
  } catch {
    log.debug(`package.json not found at ${packageJsonPath}`);
  }
  return undefined;
}

export function getCurrentVersionString(inputs: Inputs): string {
  let versionString = '';
  const log = new LogTask('getCurrentVersionString');
  // Default to enabled if not explicitly set (matches action.yml default of "true")
  const versioningEnabled = inputs.config.get('versioning:enabled');
  const isVersioningEnabled =
    versioningEnabled === undefined || versioningEnabled === true || versioningEnabled === 'true';

  if (isVersioningEnabled) {
    log.debug('version string in generated example is enabled');
    const override = inputs.config.get('versioning:override') as string;
    const versionSource = (inputs.config.get('versioning:source') as string) ?? 'git-tag';
    const actionDir = path.dirname(inputs.action.path);

    log.debug(`version source: ${versionSource}`);

    let detectedVersion: string | undefined;

    // If override is set and we're in explicit mode, use it directly
    if (versionSource === 'explicit') {
      if (override && override.length > 0) {
        detectedVersion = override;
        log.debug(`using explicit version override: ${detectedVersion}`);
      } else {
        log.debug('explicit mode but no version_override set, falling back to 0.0.0');
        detectedVersion = '0.0.0';
      }
    } else {
      // Get version based on selected source
      switch (versionSource) {
        case 'git-branch':
          detectedVersion = getVersionFromGitBranch(actionDir, log);
          break;
        case 'git-sha':
          detectedVersion = getVersionFromGitSha(actionDir, log);
          break;
        case 'package-json':
          detectedVersion = getVersionFromPackageJson(actionDir, log);
          break;
        default:
          // For git-tag (default), use the legacy fallback behavior
          detectedVersion = getVersionFromGitTag(actionDir, log);
          if (!detectedVersion) {
            detectedVersion = getVersionFromPackageJson(actionDir, log);
          }
          if (!detectedVersion) {
            detectedVersion = process.env.npm_package_version;
            log.debug(`Falling back to env:npm_package_version: ${detectedVersion ?? 'not found'}`);
          }
          break;
      }

      // Override takes precedence if set (except for explicit mode which is handled above)
      if (override && override.length > 0) {
        detectedVersion = override;
        log.debug(`using version override: ${detectedVersion}`);
      }
    }

    versionString = detectedVersion ?? '0.0.0';

    // Get prefix, defaulting to 'v' if not set
    // For git-branch and git-sha, we typically don't want a prefix
    const prefix = (inputs.config.get('versioning:prefix') as string) ?? 'v';
    const shouldApplyPrefix = versionSource !== 'git-branch' && versionSource !== 'git-sha';

    if (shouldApplyPrefix && versionString && !versionString.startsWith(prefix)) {
      versionString = `${prefix}${versionString}`;
    }
  } else {
    versionString = inputs.config.get('versioning:branch') as string;
  }
  log.debug(`version to use in generated example is ${versionString}`);
  return versionString;
}

export function indexOfRegex(str: string, providedRegex: RegExp): number {
  const regex = providedRegex.global
    ? providedRegex
    : new RegExp(providedRegex.source, `${providedRegex.flags}g`);
  let index = -1;
  let match: RegExpExecArray | null = regex.exec(str);
  while (match) {
    index = match.index;
    match = regex.exec(str);
  }
  return index;
}

export function lastIndexOfRegex(str: string, providedRegex: RegExp): number {
  const regex = providedRegex.global
    ? providedRegex
    : new RegExp(providedRegex.source, `${providedRegex.flags}g`);
  let index = -1;
  let match: RegExpExecArray | null = regex.exec(str);
  while (match) {
    index = match.index + match[0].length;
    match = regex.exec(str);
  }
  return index;
}

export function isObject(value: unknown): value is object {
  const type = typeof value;
  return type === 'object' && !!value;
}
