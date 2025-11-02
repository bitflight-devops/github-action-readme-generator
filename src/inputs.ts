/**
 * This class handles input configuration and manipulation.
 * It imports various modules and packages for file operations, configuration parsing, and logging.
 * The class has methods for initializing the input configuration, setting default values, and converting the configuration to a string.
 * It also has properties for storing the configuration values, sections, readme path, action instance, and readme editor instance.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as core from '@actions/core';
import { Context } from '@actions/github/lib/context.js';
import { IOptions, Provider } from 'nconf';
import YAML from 'yaml';

import Action, { Input } from './Action.js';
import { configFileName, ConfigKeys, README_SECTIONS, ReadmeSection } from './constants.js';
import { repositoryFinder } from './helpers.js';
import LogTask from './logtask/index.js';
import ReadmeEditor from './readme-editor.js';

/**
 * Get the filename from the import.meta.url
 */
export const __filename = fileURLToPath(import.meta.url);

/**
 * Get the directory name from the filename
 */
export const __dirname = path.dirname(__filename);

/**
 * Change working directory to output of workingDirectory()
 */
// process.chdir(workingDirectory());
export const metaActionPath = 'action.yml';

export type ArgvOptionProperties = {
  [key: string]: {
    alias: string | string[];
    describe: string;
    parseValues?: boolean;
    type?: string;
  };
};
/**
 * Represents the command line argument options for the application.
 */
const argvOptions: ArgvOptionProperties = {};

/**
 * Save option configuration.
 * @property {string} alias - Alias for the save option.
 * @property {string} describe - Description for the save option.
 * @property {boolean} parseValues - Specifies whether to parse values for the save option.
 * @property {string} type - Type of the save option.
 */
argvOptions[ConfigKeys.Save] = {
  alias: 'save',
  describe: `Save this config to ${configFileName}`,
  parseValues: true,
  type: 'boolean',
};

/**
 * Paths action option configuration.
 * @property {string | string[]} alias - Alias(es) for the pathsAction option.
 * @property {string} type - Type of the pathsAction option.
 * @property {string} describe - Description for the pathsAction option.
 */
argvOptions[ConfigKeys.pathsAction] = {
  alias: ['pathsAction', 'action'],
  type: 'string',
  describe: 'Path to the action.yml',
};

/**
 * Paths readme option configuration.
 * @property {string | string[]} alias - Alias(es) for the pathsReadme option.
 * @property {string} type - Type of the pathsReadme option.
 * @property {string} describe - Description for the pathsReadme option.
 */
argvOptions[ConfigKeys.pathsReadme] = {
  alias: ['pathsReadme', 'readme'],
  type: 'string',
  describe: 'Path to the README file',
};

/**
 * Branding SVG path option configuration.
 * @property {string} alias - Alias for the svg option.
 * @property {string} type - Type of the svg option.
 * @property {string} describe - Description for the svg option.
 */
argvOptions[ConfigKeys.BrandingSvgPath] = {
  alias: 'svg',
  type: 'string',
  describe: 'Save and load the branding svg image in the README from this path',
};

/**
 * Branding as title prefix option configuration.
 * @property {string} alias - Alias for the branding_prefix option.
 * @property {string} type - Type of the branding_prefix option.
 * @property {boolean} parseValues - Specifies whether to parse values for the branding_prefix option.
 * @property {string} describe - Description for the branding_prefix option.
 */
argvOptions[ConfigKeys.BrandingAsTitlePrefix] = {
  alias: 'branding_prefix',
  type: 'boolean',
  parseValues: true,
  describe: 'Use the branding svg as a prefix for the README title',
};

/**
 * Owner option configuration.
 * @property {string} alias - Alias for the owner option.
 * @property {string} type - Type of the owner option.
 * @property {string} describe - Description for the owner option.
 */
argvOptions[ConfigKeys.Owner] = {
  alias: 'owner',
  type: 'string',
  describe: 'The GitHub Action repository owner. i.e: `bitflight-devops`',
};

/**
 * Repo option configuration.
 * @property {string} alias - Alias for the repo option.
 * @property {string} type - Type of the repo option.
 * @property {string} describe - Description for the repo option.
 */
argvOptions[ConfigKeys.Repo] = {
  alias: 'repo',
  type: 'string',
  describe: 'The GitHub Action repository name. i.e: `github-action-readme-generator`',
};

/**
 * Prettier option configuration.
 * @property {string | string[]} alias - Alias(es) for the prettier option.
 * @property {string} type - Type of the prettier option.
 * @property {boolean} parseValues - Specifies whether to parse values for the prettier option.
 * @property {string} describe - Description for the prettier option.
 */
argvOptions[ConfigKeys.Prettier] = {
  alias: ['pretty', 'prettier'],
  type: 'boolean',
  parseValues: true,
  describe: 'Format the markdown using prettier formatter',
};

/**
 * Versioning enabled option configuration.
 * @property {string | string[]} alias - Alias(es) for the versioning_enabled option.
 * @property {string} describe - Description for the versioning_enabled option.
 * @property {boolean} parseValues - Specifies whether to parse values for the versioning_enabled option.
 * @property {string} type - Type of the versioning_enabled option.
 */
argvOptions[ConfigKeys.VersioningEnabled] = {
  alias: ['versioning', 'versioning_enabled'],
  describe:
    'Enable the update of the usage version to match the latest version in the package.json file',
  parseValues: true,
  type: 'boolean',
};

/**
 * Versioning override option configuration.
 * @property {string | string[]} alias - Alias(es) for the versioning_override option.
 * @property {string} describe - Description for the versioning_override option.
 * @property {boolean} parseValues - Specifies whether to parse values for the versioning_override option.
 */
argvOptions[ConfigKeys.VersioningOverride] = {
  alias: ['setversion', 'versioning_override', 'version_override'],
  describe: 'Set a specific version to display in the README.md',
  parseValues: true,
};

/**
 * Versioning prefix option configuration.
 * @property {string | string[]} alias - Alias(es) for the version_prefix option.
 * @property {string} describe - Description for the version_prefix option.
 * @property {boolean} parseValues - Specifies whether to parse values for the version_prefix option.
 */
argvOptions[ConfigKeys.VersioningPrefix] = {
  alias: ['vp', 'version_prefix'],
  describe: "Prefix the version with this value (if it isn't already prefixed)",
  parseValues: true,
};

/**
 * Versioning branch option configuration.
 * @property {string | string[]} alias - Alias(es) for the versioning_default_branch option.
 * @property {string} describe - Description for the versioning_default_branch option.
 * @property {boolean} parseValues - Specifies whether to parse values for the versioning_default_branch option.
 */
argvOptions[ConfigKeys.VersioningBranch] = {
  alias: ['branch', 'versioning_default_branch'],
  describe: 'If versioning is disabled show this branch instead',
  parseValues: true,
};

/**
 * Include GitHub version badge option configuration.
 * @property {string | string[]} alias - Alias(es) for the include_github_version_badge option.
 * @property {string} describe - Description for the include_github_version_badge option.
 * @property {boolean} parseValues - Specifies whether to parse values for the include_github_version_badge option.
 * @property {string} type - Type of the include_github_version_badge option.
 */
argvOptions[ConfigKeys.IncludeGithubVersionBadge] = {
  alias: ['version-badge', 'versioning_badge', 'include_github_version_badge'],
  describe: 'Display the current version as a badge',
  parseValues: true,
  type: 'boolean',
};

/**
 * Title prefix option configuration.
 * @property {string | string[]} alias - Alias(es) for the title_prefix option.
 * @property {string} describe - Description for the title_prefix option.
 * @property {boolean} parseValues - Specifies whether to parse values for the title_prefix option.
 */
argvOptions[ConfigKeys.TitlePrefix] = {
  alias: ['prefix', 'title_prefix'],
  describe: 'Add a prefix to the README title',
  parseValues: true,
};

/**
 * Debug Nconf option configuration.
 * @property {string} describe - Description for the debugNconf option.
 * @property {boolean} parseValues - Specifies whether to parse values for the debugNconf option.
 * @property {string} type - Type of the debugNconf option.
 */
argvOptions[ConfigKeys.DebugNconf] = {
  alias: ['debug_nconf'],
  describe: 'Print out the resolved nconf object with all values',
  parseValues: true,
  type: 'boolean',
};

/**
 * Debug Config option configuration.
 * @property {string} describe - Description for the debugConfig option.
 * @property {boolean} parseValues - Specifies whether to parse values for the debugConfig option.
 * @property {string} type - Type of the debugConfig option.
 */
argvOptions[ConfigKeys.DebugConfig] = {
  alias: ['debug_config'],
  describe: 'Print out the resolved nconf object with all values',
  parseValues: true,
  type: 'boolean',
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

/**
 * Interface for key/value pair object
 */
type KVPairType = {
  key: string;
  value: string | undefined;
};

/**
 * Type alias for Provider instance
 */
type ProviderInstance = InstanceType<typeof Provider>;

export function transformGitHubInputsToArgv(
  log: LogTask,
  config: ProviderInstance,
  obj: KVPairType,
): undefined | KVPairType {
  /** The obj.key is always in lowercase, but it checks for it without case sensitivity */
  if (/^(INPUT|input)_[A-Z_a-z]\w*$/.test(obj.key)) {
    log.debug(`Parsing input: ${obj.key} with ith value: ${obj.value}`);
    const keyParsed = obj.key.replace(/^(INPUT|input)_/, '').toLocaleLowerCase();
    const key = ConfigKeysInputsMap[keyParsed] || keyParsed;
    // eslint-disable-next-line no-param-reassign
    obj.key = key;
    config.set(key, obj.value);

    log.debug(`New input is ${key} with the value ${obj.value}`);
    return { key, value: obj.value };
  }
  log.debug(`Ignoring input: ${obj.key} with ith value: ${obj.value}`);
  return undefined;
}

/**
 * Sets config value from action file default
 *
 * @param {Action} actionInstance - The action instance
 * @param {string} inputName - The input name
 * @returns {string | boolean | undefined} The default value
 */
export function setConfigValueFromActionFileDefault(
  log: LogTask,
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

/**
 * Collects all default values from action file
 *
 * @returns {IOptions} The default values object
 */
export function collectAllDefaultValuesFromAction(
  log: LogTask,
  providedMetaActionPath?: string,
  providedDefaults: {
    [key: string]: Input;
  } = {},
): IOptions {
  log.debug('Collecting default values from action.yml');
  const thisActionPath = path.join(process.cwd(), providedMetaActionPath ?? metaActionPath);
  try {
    const defaultValues = {} as IOptions;
    const thisAction = new Action(thisActionPath);
    const defaults: {
      [key: string]: Input;
    } = { ...thisAction.inputs, ...providedDefaults };
    // Collect all of the default values from the action.yml file
    if (defaults) {
      for (const key of Object.keys(defaults)) {
        const mappedKey = ConfigKeysInputsMap[key] ?? key;
        defaultValues[mappedKey] = setConfigValueFromActionFileDefault(log, thisAction, key);
      }
    }
    log.debug(JSON.stringify(defaultValues, null, 2));
    return defaultValues;
  } catch (error) {
    throw new Error(`failed to load defaults from this action's action.yml: ${error}`);
  }
}

/**
 * Loads the configuration
 *
 * @returns {ProviderInstance} The configuration instance
 */
export function loadConfig(
  log: LogTask,
  providedConfig?: ProviderInstance,
  configFilePath?: string,
): ProviderInstance {
  log.debug('Loading config from env and argv');
  const config = providedConfig ?? new Provider();
  if (process.env.GITHUB_ACTION === 'true') {
    log.info('Running in GitHub action');
  }
  if (configFilePath) {
    if (fs.existsSync(configFilePath)) {
      log.info(`Config file found: ${configFilePath}`);
      config.file(configFilePath);
    } else {
      log.debug(`Config file not found: ${configFilePath}`);
    }
  }
  config
    .env({
      lowerCase: true,
      parseValues: true,
      match: /^(INPUT|input)_[A-Z_a-z]\w*$/,
      transform: (obj: KVPairType): undefined | KVPairType => {
        return transformGitHubInputsToArgv(log, config, obj);
      },
    })
    .argv(argvOptions);
  return config;
}

/**
 * Loads the default configuration
 *
 * @param {ProviderInstance} config - The config instance
 * @returns {ProviderInstance} The updated config instance
 */
export function loadDefaultConfig(
  log: LogTask,
  config: ProviderInstance,
  providedContext?: Context,
): ProviderInstance {
  log.debug('Loading default config');
  const defaultValues = collectAllDefaultValuesFromAction(log);
  const context = providedContext ?? new Context();

  // Get owner/repo from config (which includes CLI args), falling back to env vars for GitHub Actions
  const ownerFromConfig = config.get('owner') as string | undefined;
  const repoFromConfig = config.get('repo') as string | undefined;
  const ownerInput = ownerFromConfig ?? process.env.INPUT_OWNER ?? '';
  const repoInput = repoFromConfig ?? process.env.INPUT_REPO ?? '';

  const repositoryDetail = repositoryFinder(`${ownerInput}/${repoInput}`, context);
  log.debug(`repositoryDetail: ${repositoryDetail}`);
  // Apply the default values from the action.yml file
  return config.defaults({
    ...defaultValues,
    owner: repositoryDetail?.owner,
    repo: repositoryDetail?.repo,
    sections: [...README_SECTIONS] as ReadmeSection[],
  });
}

/**
 * Represents the required inputs for the action.
 */
const RequiredInputs = [
  ConfigKeys.pathsAction,
  ConfigKeys.pathsReadme,
  ConfigKeys.Owner,
  ConfigKeys.Repo,
] as const;

/**
 * Loads the required configuration
 *
 * @param {ProviderInstance} config - The config instance
 * @returns {ProviderInstance} The updated config instance
 */
export function loadRequiredConfig(
  log: LogTask,
  config: ProviderInstance,
  requiredInputs: readonly string[] = RequiredInputs,
): ProviderInstance {
  log.debug('Loading required config');

  return config.required([...requiredInputs]);
}

/**
 *
 */
export function loadAction(log: LogTask, actionPath: string): Action {
  log.debug(`Loading action from: ${actionPath}`);
  if (actionPath) {
    return new Action(path.resolve(actionPath));
  }
  throw new Error(`Action path not found: ${actionPath}`);
}

export type InputContext = {
  /**
   * The configuration instance
   */
  config?: ProviderInstance;

  /**
   * The readme sections
   */
  sections?: ReadmeSection[];

  /**
   * The readme file path
   */
  readmePath?: string;

  /**
   * The config file path
   */
  configPath?: string;

  /**
   * The action instance
   */
  action?: Action;

  /**
   * The readme editor instance
   */
  readmeEditor?: ReadmeEditor;

  /**
   * The repository owner
   */
  owner?: string;

  /**
   * The repository name
   */
  repo?: string;
};
/**
 * Main Inputs class that handles configuration
 */
export default class Inputs {
  /**
   * The configuration instance
   */
  config: ProviderInstance;

  /**
   * The readme sections
   */
  sections: ReadmeSection[];

  /**
   * The readme file path
   */
  readmePath: string;

  /**
   * The config file path
   */
  configPath: string;

  /**
   * The action instance
   */
  action: Action;

  /**
   * The readme editor instance
   */
  readmeEditor: ReadmeEditor;

  /**
   * The repository owner
   */
  owner: string;

  /**
   * The repository name
   */
  repo: string;

  /** The logger for this instance */
  log: LogTask;

  /**
   * Initializes a new instance of the Inputs class.
   */
  constructor(providedInputContext: InputContext = {}, log: LogTask = new LogTask('inputs')) {
    this.log = log ?? new LogTask('inputs');
    this.log.debug('Initializing Inputs');
    const inputContext = providedInputContext ?? {};
    this.configPath = inputContext.configPath ?? path.resolve(configFileName);
    this.config = inputContext.config ?? new Provider();
    loadConfig(log, this.config, this.configPath);
    loadDefaultConfig(log, this.config);
    loadRequiredConfig(log, this.config);

    this.action = inputContext.action ?? loadAction(log, this.config.get(ConfigKeys.pathsAction));
    this.config.set(
      'sections',
      inputContext.sections ?? (this.config.get('sections') as ReadmeSection[]),
    );
    this.sections = this.config.get('sections') as ReadmeSection[];
    this.readmePath =
      inputContext.readmePath ?? path.resolve(this.config.get(ConfigKeys.pathsReadme) as string);
    this.readmeEditor = inputContext.readmeEditor ?? new ReadmeEditor(this.readmePath);
    /**
     * Output the readme path that is being parsed
     */
    if (process.env.GITHUB_ACTIONS) {
      core.setOutput('readme', this.readmePath);
    }
    /**
     * owner is required, and if it doesn't exist it is handled by nconf which throws an error
     */
    this.owner = inputContext.owner ?? this.config.get('owner');

    /**
     * repo is required, and if it doesn't exist it is handled by nconf which throws an error
     */
    this.repo = inputContext.repo ?? this.config.get('repo');
  }

  stringify(): string {
    if (this?.config) {
      try {
        return YAML.stringify(this.config.get());
      } catch (error) {
        this.log.error(`${error}`);
        // continue
      }
    }
    // this is just for debug, no need to stop the process if it fails
    return '';
  }
}
