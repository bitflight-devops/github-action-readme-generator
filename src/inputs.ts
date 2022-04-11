/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import * as core from '@actions/core';
import type { Context } from '@actions/github/lib/context';
import * as fs from 'fs';
import nconf from 'nconf';
import * as path from 'path';

import Action from './Action';
import { repositoryFinder } from './helpers';
import LogTask from './logtask';
import { workingDirectory } from './working-directory';

const log = new LogTask('inputs');
process.chdir(workingDirectory());
const githubEventPath = process.env['GITHUB_EVENT_PATH'] ?? '';
let githubEvent: Context | null = null;
try {
  githubEvent = JSON.parse(fs.readFileSync(githubEventPath, 'utf8')) as Context;
} catch (err) {
  // File not there
  log.debug(`GITHUB_EVENT_PATH not found: ${githubEventPath}`);
}

export const configKeys: string[] = [
  'paths:action',
  'paths:readme',
  'show_logo',
  'versioning:enabled',
  'versioning:override',
  'versioning:prefix',
  'versioning:branch',
  'owner',
  'repo',
  'title_prefix',
  'pretty',
];
export default class Inputs {
  constructor() {
    nconf.use('file', { file: '.ghadocs.json', dir: workingDirectory(), search: true });
    const repositryDetail = repositoryFinder(null, githubEvent);

    if (process.env['GITHUB_WORKSPACE']) {
      log.info('running in action');
      nconf.set('paths:action', core.getInput('action'));
      nconf.set('paths:readme', core.getInput('readme'));
      nconf.set('show_logo', core.getInput('logo'));
      nconf.set('pretty', core.getInput('pretty'));
      nconf.set('versioning:enabled', core.getInput('versioning_enabled'));
      nconf.set('versioning:override', core.getInput('versioning_override'));
      nconf.set('versioning:prefix', core.getInput('version_prefix'));
      nconf.set('versioning:branch', core.getInput('versioning_default_branch'));
      nconf.set('title_prefix', core.getInput('title_prefix'));
    }

    nconf
      .argv({
        save: {
          alias: 'save',
          describe: 'Save this config to .ghadocs.json',
          parseValues: true,
        },
        'paths:action': {
          alias: 'action',
          describe: 'Path to the action.yml',
          parseValues: true,
        },
        'paths:readme': {
          alias: 'readme',
          describe: 'Path to the README.md',
          parseValues: true,
        },
        show_logo: {
          alias: 'logo',
          describe: "Display the action's logo in the README",
          parseValues: true,
        },
        owner: {
          alias: 'owner',
          describe: 'The GitHub Action repository owner. i.e: `bitflight-devops`',
          default: repositryDetail?.owner,
          parseValues: true,
        },
        repo: {
          alias: 'repo',
          describe: 'The GitHub Action repository name. i.e: `github-action-readme-generator`',
          default: repositryDetail?.repo,
          parseValues: true,
        },
        prettier: {
          alias: 'pretty',
          describe: 'Format the markdown using prettier formatter',
          parseValues: true,
        },
        'versioning:enabled': {
          alias: 'versioning',
          describe:
            'Enable the update of the usage version to match the latest version in the package.json file',
          parseValues: true,
        },
        'versioning:override': {
          alias: 'version',
          describe: 'Set a specific version to display in the README.md',
          parseValues: true,
        },
        'versioning:prefix': {
          alias: 'vp',
          describe: "Prefix the version with this value (if it isn't already prefixed)",
          parseValues: true,
        },
        'versioning:branch': {
          alias: 'branch',
          describe: 'If versioning is disabled show this branch instead',
          parseValues: true,
        },
        title_prefix: {
          alias: 'prefix',
          describe: 'Add a prefix to the README title',
          parseValues: true,
        },
      })
      .defaults({
        save: 'true',
        owner: repositryDetail?.owner,
        repo: repositryDetail?.repo,
        paths: {
          action: 'action.yml',
          readme: 'README.md',
        },
        show_logo: 'true',
        pretty: 'true',
        versioning: {
          enabled: 'true',
          override: '',
          prefix: 'v',
          branch: 'main',
        },
        title_prefix: 'GitHub Action: ',
        sections: ['title', 'description', 'usage', 'inputs', 'outputs', 'contents'],
      })
      .required(['owner', 'repo']);

    configKeys.forEach((k, v) => log.debug(`${k}: ${v}`));
    this.sections = nconf.get('sections') as string[];
    this.readmePath = path.resolve(workingDirectory(), nconf.get('paths:readme') as string);
    const actionPath = path.resolve(workingDirectory(), nconf.get('paths:action') as string);
    this.action = new Action(actionPath);
  }

  public sections: string[];

  public readmePath: string;

  public action: Action;
}
