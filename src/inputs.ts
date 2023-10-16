/* eslint-disable @typescript-eslint/explicit-member-accessibility */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Context } from '@actions/github/lib/context';
import * as yaml from 'js-yaml';
import * as nconf from 'nconf';

import Action from './Action';
import { repositoryFinder } from './helpers';
import LogTask from './logtask';
import ReadmeEditor from './readme-editor';
import { workingDirectory } from './working-directory';

const log = new LogTask('inputs');
process.chdir(workingDirectory());
const githubEventPath = process.env.GITHUB_EVENT_PATH ?? '';
let githubEvent: Context | null = null;
try {
  githubEvent = JSON.parse(fs.readFileSync(githubEventPath, 'utf8')) as Context;
} catch {
  // File not there
  log.debug(`GITHUB_EVENT_PATH not found: ${githubEventPath}`);
}
export const configFileName = '.ghadocs.json';
const pathsAction = 'paths:action';
const pathsReadme = 'paths:readme';
export const configKeys: string[] = [
  'save',
  pathsAction,
  pathsReadme,
  'show_logo',
  'versioning:enabled',
  'versioning:override',
  'versioning:prefix',
  'versioning:branch',
  'owner',
  'repo',
  'title_prefix',
  'pretty',
  'include_github_version_badge',
];
interface KVPairType {
  key: string;
  value: string | undefined;
}
export default class Inputs {
  public config: nconf.Provider;

  public sections: string[];

  public readmePath: string;

  public configPath: string;

  public action: Action;

  public readmeEditor: ReadmeEditor;

  constructor() {
    this.configPath = path.resolve(configFileName);
    this.config = new nconf.Provider();
    const repositoryDetail = repositoryFinder(null, githubEvent);
    if (process.env.GITHUB_ACTION) {
      log.info('running in GitHub action');
    }
    if (fs.existsSync(this.configPath)) {
      log.info(`config file found: ${this.configPath}`);
    } else {
      log.error(`config file not found: ${this.configPath}`);
    }
    this.config
      .env({
        lowerCase: true,
        parseValues: true,
        match: /^INPUT_/,
        transform: (obj: KVPairType): undefined | KVPairType => {
          if (obj.key.startsWith('input_')) {
            const newObj: KVPairType = {
              key: obj.key,
              value: obj.value,
            };
            const keyParsed = obj.key.replace(/^(INPUT|input)_/, '');
            switch (keyParsed) {
              case 'readme': {
                newObj.key = pathsReadme;
                break;
              }
              case 'action': {
                newObj.key = pathsAction;
                break;
              }
              case 'versioning_enabled': {
                newObj.key = 'versioning:enabled';
                break;
              }
              case 'version_prefix': {
                newObj.key = 'versioning:prefix';
                break;
              }
              case 'versioning_default_branch': {
                newObj.key = 'versioning:branch';
                break;
              }
              case 'version_override': {
                newObj.key = 'versioning:override';
                break;
              }
              case 'include_github_version_badge': {
                newObj.key = 'versioning:badge';
                break;
              }
              default: {
                newObj.key = keyParsed;
                break;
              }
            }
            if (newObj.value) {
              this.config.set(newObj.key, newObj.value);
            }
            return newObj;
          }
          return undefined;
        },
      })
      .argv({
        'save': {
          alias: 'save',
          describe: `Save this config to ${configFileName}`,
          parseValues: true,
          type: 'boolean',
        },
        'paths:action': {
          alias: ['pathsAction', 'action'],
          type: 'string',
          describe: 'Path to the action.yml',
        },
        'paths:readme': {
          alias: ['pathsReadme', 'readme'],
          type: 'string',
          describe: 'Path to the README file',
        },
        'show_logo': {
          alias: 'logo',
          describe: "Display the action's logo in the README",
        },
        'owner': {
          alias: 'owner',
          describe: 'The GitHub Action repository owner. i.e: `bitflight-devops`',
        },
        'repo': {
          alias: 'repo',
          describe: 'The GitHub Action repository name. i.e: `github-action-readme-generator`',
        },
        'prettier': {
          alias: 'pretty',
          describe: 'Format the markdown using prettier formatter',
          parseValues: true,
          type: 'boolean',
        },
        'versioning:enabled': {
          alias: ['versioning', 'versioning_enabled'],
          describe:
            'Enable the update of the usage version to match the latest version in the package.json file',
          parseValues: true,
          type: 'boolean',
        },
        'versioning:override': {
          alias: ['setversion', 'versioning_override', 'version_override'],
          describe: 'Set a specific version to display in the README.md',
          parseValues: true,
        },
        'versioning:prefix': {
          alias: ['vp', 'version_prefix'],
          describe: "Prefix the version with this value (if it isn't already prefixed)",
          parseValues: true,
        },
        'versioning:branch': {
          alias: ['branch', 'versioning_default_branch'],
          describe: 'If versioning is disabled show this branch instead',
          parseValues: true,
        },
        'versioning:badge': {
          alias: ['version-badge', 'versioning_badge'],
          describe: 'Display the current version as a badge',
          parseValues: true,
          type: 'boolean',
        },
        'title_prefix': {
          alias: ['prefix', 'title_prefix'],
          describe: 'Add a prefix to the README title',
          parseValues: true,
        },
      })
      .file(this.configPath)
      .defaults({
        save: true,
        owner: repositoryDetail?.owner,
        repo: repositoryDetail?.repo,
        paths: {
          action: 'action.yml',
          readme: 'README.md',
        },
        show_logo: true,
        pretty: true,
        versioning: {
          enabled: true,
          override: '',
          prefix: 'v',
          branch: 'main',
          badges: true,
        },
        title_prefix: 'GitHub Action: ',
        sections: ['title', 'description', 'usage', 'inputs', 'outputs', 'contents', 'badges'],
      })
      .required(['owner', 'repo']);

    this.sections = this.config.get('sections') as string[];
    this.readmePath = path.resolve(this.config.get(pathsReadme) as string);
    const actionPath = path.resolve(this.config.get(pathsAction) as string);
    this.action = new Action(actionPath);
    this.readmeEditor = new ReadmeEditor(this.readmePath);
    if (LogTask.isDebug()) {
      log.debug('resolved inputs:');
      log.debug(this.stringify());
      log.debug('resolved action:');
      log.debug(this.action.stringify());
    }
  }

  stringify(): string {
    if (this) {
      const output: string[] = [];
      for (const k of configKeys) {
        output.push(`${k}: ${this.config.get(k)}`);
      }
      return yaml.dump(output, {
        skipInvalid: true,
      });
    }
    return '';
  }
}
