import { execSync } from 'node:child_process';
import { accessSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Context } from '@actions/github/lib/context.js';
import type { PackageJson } from 'types-package-json';

import type Inputs from './inputs.js';
import LogTask from './logtask/index.js';
import { unicodeWordMatch } from './unicode-word-match.js';
import { notEmpty, Nullable } from './util.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
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
  if (!pathStr) return undefined;
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
  if (!pathStr) return null;
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
  if (!text) return undefined;
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
  if (!text) return undefined;
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
export function wrapText(text: string | undefined, content: string[], prepend = ''): string[] {
  // Constrain the width of the description
  if (!text) return content;
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

/**
 * Represents the interface for capturing owner and repo properties from a regular expression match.
 */
interface OwnerRepoInterface extends RegExpExecArray {
  groups?: {
    [key: string]: string;
    owner: string;
    repo: string;
  };
}
export function readFile(filename: string): string {
  try {
    return readFileSync(filename, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read file ${filename}: ${error}`);
  }
}

export const remoteGitUrlPattern = /url( )?=( )?.*github\.com[/:](?<owner>.*)\/(?<repo>.*)\.git/;
/**
 * Finds the repository information from the input, context, environment variables, or git configuration.
 * @param inputRepo - The input repository string.
 * @param context - The GitHub context object.
 * @returns The repository information (owner and repo) or null if not found.
 */
export function repositoryFinder(
  inputRepo: Nullable<string>,
  context: Nullable<Context>,
): Repo | null {
  const log = new LogTask('repositoryFinder');
  const obj = {} as unknown;
  const result = obj as Repo;
  if (notEmpty(inputRepo)) {
    [result.owner, result.repo] = inputRepo.split('/') as [string, string];
    log.info(`repositoryFinder using input ${inputRepo} and returns ${JSON.stringify(result)}`);
    return result;
  }
  if (notEmpty(process.env.GITHUB_REPOSITORY)) {
    [result.owner, result.repo] = process.env.GITHUB_REPOSITORY.split('/') as [string, string];
    log.info(
      `repositoryFinder using GITHUB_REPOSITORY ${
        process.env.GITHUB_REPOSITORY
      } and returns ${JSON.stringify(result)}`,
    );
    return result;
  }
  if (context) {
    result.owner = context.repo.owner;
    result.repo = context.repo.repo;

    log.info(`repositoryFinder using GitHub context and returns ${JSON.stringify(result)}`);
    return result;
  }
  if (notEmpty(process.env.INPUT_OWNER) && notEmpty(process.env.INPUT_REPO)) {
    result.owner = process.env.INPUT_OWNER;
    result.repo = process.env.INPUT_REPO;
    return result;
  }
  try {
    const fileContent = readFile('.git/config');

    const results = remoteGitUrlPattern.exec(fileContent) as OwnerRepoInterface;
    if (results.length > 0) {
      log.debug(JSON.stringify(results.groups));
      result.owner = results.groups?.owner ?? '';
      result.repo = results.groups?.repo ?? '';

      return result;
    }
  } catch (error) {
    // can't find it
    log.error(`Couldn't find any owner or repo: ${error}`);
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
 * Removes formatting from the string and converts it to code style.
 *
 * @param value - The string to format as a header
 * @returns The formatted row header string
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

  // Add code formatting
  return `<code>${text}</code>`;
}

export function getCurrentVersionString(inputs: Inputs): string {
  let versionString = '';
  const log = new LogTask('getCurrentVersionString');
  if (inputs.config.get('versioning:enabled')) {
    log.debug('version string in generated example is enabled');
    const oRide = inputs.config.get('versioning:override') as string;
    let packageVersion = process.env.npm_package_version;
    log.debug(`version string in env:npm_package_version is ${packageVersion ?? 'not found'}`);
    if (!packageVersion) {
      log.debug('version string in env:npm_package_version is not found, trying to use git');
      try {
        accessSync('package.json');
        const packageData: Partial<PackageJson> = JSON.parse(readFileSync('package.json', 'utf8'));
        packageVersion = packageData.version;
      } catch (error) {
        log.debug(`package.json not found. ${error}`);
      }
      log.debug(`version string in package.json:version is ${packageVersion ?? 'not found'}`);
    }

    versionString = oRide && oRide.length > 0 ? oRide : packageVersion ?? '0.0.0';

    if (
      versionString &&
      !versionString.startsWith(inputs.config.get('versioning:prefix') as string)
    ) {
      versionString = `${inputs.config.get('versioning:prefix') as string}${versionString}`;
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

export function isObject(value: any): value is object {
  const type = typeof value;
  return type === 'object' && !!value;
}
