import type { Repo } from '../helpers';
import type Inputs from '../inputs';
import LogTask from '../logtask';
import updateReadme from '../readme-writer';

export interface IBadge {
  alt: string;
  img: string;
  url?: string;
}
export default async function updateBadges(token: string, inputs: Inputs): Promise<void> {
  const log = new LogTask(token);
  const enableVersioning = inputs.config.get('versioning:badges');
  const badges: IBadge[] = [];
  const repos: Repo = {
    owner: inputs.config.get('owner'),
    repo: inputs.config.get('repo'),
  };

  /**
   * Generate github badges.
   * @param githubId
   */
  function githubBadges(): IBadge[] {
    const repoUrl = `https://github.com/${repos.owner}/${repos.repo}`;
    return [
      {
        img: `https://img.shields.io/github/v/release/${repos.owner}/${repos.repo}?display_name=tag&sort=semver&logo=github&style=flat-square`,
        alt: 'Release',
        url: `${repoUrl}/releases/latest`,
      },
      {
        img: `https://img.shields.io/github/release-date/${repos.owner}/${repos.repo}?display_name=tag&sort=semver&logo=github&style=flat-square`,
        alt: 'Release',
        url: `${repoUrl}/releases/latest`,
      },
      {
        img: `https://img.shields.io/github/last-commit/${repos.owner}/${repos.repo}?logo=github&style=flat-square`,
        alt: 'Commit',
      },
      {
        img: `https://img.shields.io/github/issues/${repos.owner}/${repos.repo}?logo=github&style=flat-square`,
        alt: 'Open Issues',
        url: `${repoUrl}/issues`,
      },
      {
        img: `https://img.shields.io/github/downloads/${repos.owner}/${repos.repo}/total?logo=github&style=flat-square`,
        alt: 'Downloads',
      },
    ];
  }
  /**
   * Generates a badge.
   */
  function generateBadge(item: IBadge): string {
    const badgeTemplate = `<img src="${item.img}" alt="${item.alt || ''}" />`;
    if (item.url) {
      return `<a href="${item.url}">${badgeTemplate}</a>`;
    }
    return badgeTemplate;
  }
  /**
   * Generates all badges.
   */
  function generateBadges(): string[] {
    const badgeArray = [];
    for (const b of badges) {
      badgeArray.push(generateBadge(b));
    }
    return [badgeArray.join('')];
  }

  log.start();

  // Add Github badges
  if (enableVersioning) {
    badges.push(...githubBadges());
  }
  const content = generateBadges();
  await updateReadme(content, token, inputs.readmePath);
  log.success();
}
