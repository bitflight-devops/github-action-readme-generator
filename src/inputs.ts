/**
 * This TypeScript code defines a class named 'Inputs' that handles input configuration and manipulation.
 * It imports various modules and packages for file operations, configuration parsing, and logging.
 * The class has methods for initializing the input configuration, setting default values, and converting the configuration to a string.
 * It also has properties for storing the configuration values, sections, readme path, action instance, and readme editor instance.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Context } from '@actions/github/lib/context.js';
import { IOptions, Provider } from 'nconf';
import YAML from 'yaml';

import Action from './Action.js';
import {
  configFileName,
  ConfigKeys,
  README_SECTIONS,
  ReadmeSection,
  RequiredInputs,
} from './constants.js';
import { repositoryFinder } from './helpers.js';
import LogTask from './logtask/index.js';
import ReadmeEditor from './readme-editor.js';
import workingDirectory from './working-directory.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

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
const argvOptions: Record<string, object> = {};
argvOptions[ConfigKeys.Save] = {
  alias: 'save',
  describe: `Save this config to ${configFileName}`,
  parseValues: true,
  type: 'boolean',
};
argvOptions[ConfigKeys.pathsAction] = {
  alias: ['pathsAction', 'action'],
  type: 'string',
  describe: 'Path to the action.yml',
};
argvOptions[ConfigKeys.pathsReadme] = {
  alias: ['pathsReadme', 'readme'],
  type: 'string',
  describe: 'Path to the README file',
};
argvOptions[ConfigKeys.BrandingSvgPath] = {
  alias: 'svg',
  type: 'string',
  describe: 'Save and load the branding svg image in the README from this path',
};
argvOptions[ConfigKeys.BrandingAsTitlePrefix] = {
  alias: 'branding_prefix',
  type: 'boolean',
  parseValues: true,
  describe: 'Use the branding svg as a prefix for the README title',
};
argvOptions[ConfigKeys.Owner] = {
  alias: 'owner',
  type: 'string',
  describe: 'The GitHub Action repository owner. i.e: `bitflight-devops`',
};
argvOptions[ConfigKeys.Repo] = {
  alias: 'repo',
  type: 'string',
  describe: 'The GitHub Action repository name. i.e: `github-action-readme-generator`',
};
argvOptions[ConfigKeys.Prettier] = {
  alias: ['pretty', 'prettier'],
  type: 'boolean',
  parseValues: true,
  describe: 'Format the markdown using prettier formatter',
};
argvOptions[ConfigKeys.VersioningEnabled] = {
  alias: ['versioning', 'versioning_enabled'],
  describe:
    'Enable the update of the usage version to match the latest version in the package.json file',
  parseValues: true,
  type: 'boolean',
};
argvOptions[ConfigKeys.VersioningOverride] = {
  alias: ['setversion', 'versioning_override', 'version_override'],
  describe: 'Set a specific version to display in the README.md',
  parseValues: true,
};
argvOptions[ConfigKeys.VersioningPrefix] = {
  alias: ['vp', 'version_prefix'],
  describe: "Prefix the version with this value (if it isn't already prefixed)",
  parseValues: true,
};
argvOptions[ConfigKeys.VersioningBranch] = {
  alias: ['branch', 'versioning_default_branch'],
  describe: 'If versioning is disabled show this branch instead',
  parseValues: true,
};
argvOptions[ConfigKeys.IncludeGithubVersionBadge] = {
  alias: ['version-badge', 'versioning_badge', 'include_github_version_badge'],
  describe: 'Display the current version as a badge',
  parseValues: true,
  type: 'boolean',
};
argvOptions[ConfigKeys.TitlePrefix] = {
  alias: ['prefix', 'title_prefix'],
  describe: 'Add a prefix to the README title',
  parseValues: true,
};

/**
 * Configuration inputs from the github action don't
 * all match the input names when running on cli.
 * This maps the action inputs to the cli.
 */
const ConfigKeysInputsMap: Record<string, string> = {
  save: ConfigKeys.Save,
  action: ConfigKeys.pathsAction,
  readme: ConfigKeys.pathsReadme,
  branding_svg_path: ConfigKeys.BrandingSvgPath,
  branding_as_title_prefix: ConfigKeys.BrandingAsTitlePrefix,
  versioning_enabled: ConfigKeys.VersioningEnabled,
  version_prefix: ConfigKeys.VersioningPrefix,
  versioning_default_branch: ConfigKeys.VersioningBranch,
  version_override: ConfigKeys.VersioningOverride,
  include_github_version_badge: ConfigKeys.IncludeGithubVersionBadge,
  owner: ConfigKeys.Owner,
  repo: ConfigKeys.Repo,
  title_prefix: ConfigKeys.TitlePrefix,
  pretty: ConfigKeys.Prettier,
};

interface KVPairType {
  key: string;
  value: string | undefined;
}
type ProviderInstance = InstanceType<typeof Provider>;

function setConfigValueFromActionFileDefault(
  actionInstance: Action,
  inputName: string,
): string | boolean | undefined {
  if (ConfigKeysInputsMap[inputName] === undefined) {
    log.error(
      `${inputName} from ${
        actionInstance.path
      } does not match a known input. Known inputs are: ${Object.keys(ConfigKeysInputsMap)}`,
    );
    return;
  }

  const configName = ConfigKeysInputsMap[inputName];
  const defaultValue = actionInstance.inputDefault(inputName);
  log.debug(`Default Value for action.yml: ${inputName} CLI: ${configName} = ${defaultValue}`);
  return defaultValue;
}

export default class Inputs {
  config: ProviderInstance;

  sections: ReadmeSection[];

  readmePath: string;

  configPath: string;

  action: Action;

  readmeEditor: ReadmeEditor;

  owner: string;

  repo: string;

  /**
   * Initializes a new instance of the Inputs class.
   */
  constructor() {
    this.configPath = path.resolve(configFileName);
    this.config = new Provider();
    const repositoryDetail = repositoryFinder(null, githubEvent);
    if (process.env.GITHUB_ACTION) {
      log.info('Running in GitHub action');
    }
    if (fs.existsSync(this.configPath)) {
      log.info(`Config file found: ${this.configPath}`);
    } else {
      log.error(`Config file not found: ${this.configPath}`);
    }
    this.config

      .file(this.configPath)
      .env({
        lowerCase: true,
        parseValues: true,
        match: /^(INPUT|input)_[A-Z_a-z]\w*$/,
        transform: (obj: KVPairType): undefined | KVPairType => {
          if (/^(INPUT|input)_[A-Z_a-z]\w*$/.test(obj.key)) {
            log.debug(`Parsing input: ${obj.key} with ith value: ${obj.value}`);
            const keyParsed = obj.key.replace(/^(INPUT|input)_/, '');
            // eslint-disable-next-line no-param-reassign
            obj.key = ConfigKeysInputsMap[keyParsed] || keyParsed;

            this.config.set(ConfigKeysInputsMap[keyParsed] || keyParsed, obj.value);

            log.debug(`New input is ${obj.key} with the value ${obj.value}`);
            return obj;
          }
          log.debug(`Ignoring input: ${obj.key} with ith value: ${obj.value}`);
          return undefined;
        },
      })
      .argv(argvOptions);

    const actionPath = path.resolve(this.config.get(ConfigKeys.pathsAction) as string);
    this.action = new Action(actionPath);
    const defaultValues = {} as IOptions;
    try {
      const thisActionPath = path.join(__dirname, '../../action.yml');
      const thisAction = new Action(thisActionPath);
      // Collect all of the default values from the action.yml file
      for (const key of Object.keys(thisAction.inputs)) {
        const mappedKey = ConfigKeysInputsMap[key] ?? key;
        defaultValues[mappedKey] = setConfigValueFromActionFileDefault(thisAction, key);
      }
      log.debug(JSON.stringify(defaultValues, null, 2));
    } catch (error) {
      log.info(`failed to load defaults from action's action.yml: ${error}`);
    }
    // Apply the default values from the action.yml file
    this.config
      .defaults({
        ...defaultValues,
        owner: repositoryDetail?.owner,
        repo: repositoryDetail?.repo,
        sections: [...README_SECTIONS] as ReadmeSection[],
      })
      .required([...RequiredInputs]);
    this.sections = this.config.get('sections') as ReadmeSection[];
    this.readmePath = path.resolve(this.config.get(ConfigKeys.pathsReadme) as string);
    this.readmeEditor = new ReadmeEditor(this.readmePath);
    const owner = this.config.get('owner') as string;
    const repo = this.config.get('repo') as string;

    if (!owner || !repo) {
      const errMsg =
        'Owner or repo is not defined, and not found automatically. Please pass in these variables.';
      log.fail(errMsg);
      throw new Error(errMsg);
    }
    this.owner = owner;
    this.repo = repo;
    if (LogTask.isDebug()) {
      try {
        log.debug(`readme file path: ${this.config.get(ConfigKeys.pathsReadme)}`);
        log.debug('resolved nconf:');
        log.debug(JSON.stringify(this.config.get(), null, 2));
        log.debug('resolved inputs:');
        log.debug(this.stringify());
        log.debug('resolved action:');
        log.debug(this.action.stringify());
      } catch (error) {
        log.debug(`${error}`);
      }
    }
  }

  stringify(): string {
    if (this) {
      const output: string[] = [];
      for (const k of Object.values(ConfigKeys)) {
        output.push(`${k}: ${this.config.get(k)}`);
      }
      try {
        return YAML.stringify(output);
      } catch (error) {
        log.error(`${error}`);
      }
    }
    return '';
  }
}
