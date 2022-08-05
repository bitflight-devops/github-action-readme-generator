import type { Context } from '@actions/github/lib/context';
import * as fs from 'node:fs';

import LogTask from './logtask';

export function wrapText(text: string | undefined, content: string[], prepend = ''): string[] {
  // Constrain the width of the description
  if (!text) return content;

  const width = 80;
  let description = text
    .trimEnd()
    .replace(/\r\n/g, '\n') // Convert CR to LF
    .replace(/ +/g, ' ') //    Squash consecutive spaces
    .replace(/ \n/g, '\n'); //  Squash space followed by newline
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
export interface Repo {
  owner: string;
  repo: string;
}

export function repositoryFinder(
  inputRepo: string | undefined | null,
  context: Context | undefined | null,
): Repo | null {
  const log = new LogTask('repositoryFinder');
  const obj = {} as unknown;
  const result = obj as Repo;
  if (inputRepo) {
    [result.owner, result.repo] = inputRepo.split('/') as [string, string];
    log.info(`repositoryFinder using input ${inputRepo} and returns ${JSON.stringify(result)}`);
    return result;
  }
  if (process.env['GITHUB_REPOSITORY']) {
    [result.owner, result.repo] = process.env['GITHUB_REPOSITORY'].split('/') as [string, string];
    log.info(
      `repositoryFinder using GITHUB_REPOSITORY ${process.env['GITHUB_REPOSITORY']} and returns ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  }
  if (context) {
    result.owner = context.repo.owner;
    result.repo = context.repo.repo;

    log.info(
      `repositoryFinder using GITHUB_REPOSITORY ${process.env['GITHUB_REPOSITORY']} and returns ${JSON.stringify(
        result,
      )}`,
    );
    return result;
  }
  if (process.env['INPUT_OWNER'] && process.env['INPUT_REPO']) {
    result.owner = process.env['INPUT_OWNER'];
    result.repo = process.env['INPUT_REPO'];
    return result;
  }
  try {
    const fileContent = fs.readFileSync('.git/config', 'utf8');
    // eslint-disable-next-line security/detect-unsafe-regex
    const pattern = /url( )?=( )?.*github\.com[/:](?<owner>.*)\/(?<repo>.*)\.git/;

    interface OwnerRepoInterface extends RegExpExecArray {
      groups: {
        [key: string]: string;
        owner?: string;
        repo?: string;
      };
    }

    const results = fileContent.match(pattern) as OwnerRepoInterface;
    if (results !== null) {
      log.debug(JSON.stringify(results.groups));
      result.owner = results.groups.owner ?? '';
      result.repo = results.groups.repo ?? '';
    }
    return result;
  } catch (error) {
    // can't find it
    log.debug(`Couldn't find any owner or repo: ${error}`);
  }
  return result;
}
