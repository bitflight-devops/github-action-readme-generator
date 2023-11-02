/**
 * This TypeScript code imports necessary modules and defines a function named 'updateBadges' which takes a sectionToken (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the badges section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes.
 */

import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';

/**
 * Interface for a badge.
 */
export interface IBadge {
  alt: string;
  img: string;
  url?: string;
}

/**
 * Generate GitHub badges.
 * @returns {IBadge[]} - The array of GitHub badges.
 */
function githubBadges(owner: string, repo: string): IBadge[] {
  const repoUrl = `https://github.com/${owner}/${repo}`;
  return [
    {
      img: `https://img.shields.io/github/v/release/${owner}/${repo}?display_name=tag&sort=semver&logo=github&style=flat-square`,
      alt: 'Release by tag',
      url: `${repoUrl}/releases/latest`,
    },
    {
      img: `https://img.shields.io/github/release-date/${owner}/${repo}?display_name=tag&sort=semver&logo=github&style=flat-square`,
      alt: 'Release by date',
      url: `${repoUrl}/releases/latest`,
    },
    {
      img: `https://img.shields.io/github/last-commit/${owner}/${repo}?logo=github&style=flat-square`,
      alt: 'Commit',
    },
    {
      img: `https://img.shields.io/github/issues/${owner}/${repo}?logo=github&style=flat-square`,
      alt: 'Open Issues',
      url: `${repoUrl}/issues`,
    },
    {
      img: `https://img.shields.io/github/downloads/${owner}/${repo}/total?logo=github&style=flat-square`,
      alt: 'Downloads',
    },
  ];
}

/**
 * Generates a badge HTML markup.
 * @param {IBadge} item - The badge object.
 * @returns {string} - The HTML markup for the badge.
 */
function generateBadge(item: IBadge, log: LogTask): string {
  const badgeTemplate = `<img src="${item.img}" alt="${item.alt || ''}" />`;
  log.info(`Generating badge ${item.alt}`);
  if (item.url) {
    return `<a href="${item.url}">${badgeTemplate}</a>`;
  }
  return badgeTemplate;
}

/**
 * Generates all badges HTML markup.
 * @returns {string[]} - The array of HTML markup for all badges.
 */
function generateBadges(badges: IBadge[], log: LogTask): string[] {
  const badgeArray: string[] = [];
  for (const b of badges) {
    badgeArray.push(generateBadge(b, log));
  }
  log.debug(`Total badges: ${badgeArray.length}`);
  return badgeArray;
}
export default function updateBadges(
  sectionToken: ReadmeSection,
  inputs: Inputs,
): Record<string, string> {
  const log = new LogTask(sectionToken);
  const enableVersioning = inputs.config.get()?.versioning?.badge;
  log.info(`Versioning badge: ${enableVersioning}`);

  log.start();
  let content = '';
  // Add GitHub badges
  if (enableVersioning) {
    const badges: IBadge[] = githubBadges(inputs.owner, inputs.repo);
    content = generateBadges(badges, log).join('');
    inputs.readmeEditor.updateSection(sectionToken, content);
  }
  log.success();
  const ret: Record<string, string> = {};
  ret[sectionToken] = content;
  return ret;
}
