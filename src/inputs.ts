/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Context } from '@actions/github/lib/context.js';
import YAML from 'yaml';

import Action from './Action.js';
import { repositoryFinder } from './helpers.js';
import LogTask from './logtask/index.js';
import { Provider } from './nconf/nconf.cjs';
import ReadmeEditor from './readme-editor.js';
import { workingDirectory } from './working-directory.js';

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
  'branding_svg_path',
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
type ProviderInstance = InstanceType<typeof Provider>;
export default class Inputs {
  public config: ProviderInstance;

  public sections: string[];

  public readmePath: string;

  public configPath: string;

  public action: Action;

  public readmeEditor: ReadmeEditor;

  constructor() {
    this.configPath = path.resolve(configFileName);
    this.config = new Provider();
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
        'branding_svg_path': {
          alias: 'svg',
          type: 'string',
          describe: 'Save and load the branding svg image in the README from this path',
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
        owner: repositoryDetail?.owner,
        repo: repositoryDetail?.repo,
        sections: [
          'title',
          'branding',
          'description',
          'usage',
          'inputs',
          'outputs',
          'contents',
          'badges',
        ],
      })
      .required(['owner', 'repo']);

    this.sections = this.config.get('sections') as string[];

    const actionPath = path.resolve(this.config.get(pathsAction) as string);
    this.action = new Action(actionPath);
    this.readmePath = path.resolve(this.config.get(pathsReadme) as string);
    try {
      const thisActionPath = path.join(__dirname, '../../action.yml');
      const thisAction = new Action(thisActionPath);
      this.setConfigValueFromActionFileDefault(thisAction, 'readme', pathsReadme);
      this.setConfigValueFromActionFileDefault(thisAction, 'title_prefix');
      this.setConfigValueFromActionFileDefault(thisAction, 'save');
      this.setConfigValueFromActionFileDefault(thisAction, 'pretty');
      this.setConfigValueFromActionFileDefault(
        thisAction,
        'versioning_enabled',
        'versioning:enabled',
      );
      this.setConfigValueFromActionFileDefault(
        thisAction,
        'versioning_default_branch',
        'versioning:branch',
      );
      this.setConfigValueFromActionFileDefault(
        thisAction,
        'version_override',
        'versioning:override',
      );
      this.setConfigValueFromActionFileDefault(thisAction, 'version_prefix', 'versioning:prefix');
      this.setConfigValueFromActionFileDefault(
        thisAction,
        'include_github_version_badge',
        'versioning:badges',
      );
      this.setConfigValueFromActionFileDefault(thisAction, 'branding_svg_path');
    } catch (error) {
      log.info(`failed to load defaults from action's action.yml: ${error}`);
    }

    this.readmeEditor = new ReadmeEditor(this.readmePath);
    if (LogTask.isDebug()) {
      try {
        log.debug('resolved inputs:');
        log.debug(this.stringify());
        log.debug('resolved action:');
        log.debug(this.action.stringify());
      } catch (error) {
        if (typeof error === 'string') {
          log.debug(error);
        }
      }
    }
  }

  setConfigValueFromActionFileDefault(
    actionInstance: Action,
    inputName: string,
    providedConfigName?: string,
  ): void {
    const configName = providedConfigName ?? inputName;
    this.config.set(
      configName,
      this.config.get(configName) ?? actionInstance.inputDefault(inputName),
    );
  }

  stringify(): string {
    if (this) {
      const output: string[] = [];
      for (const k of configKeys) {
        output.push(`${k}: ${this.config.get(k)}`);
      }
      return YAML.stringify(output);
    }
    return '';
  }
}
