/**
 * This class handles input configuration and manipulation.
 * It imports various modules and packages for file operations, configuration parsing, and logging.
 * The class has methods for initializing the input configuration, setting default values, and converting the configuration to a string.
 * It also has properties for storing the configuration values, sections, readme path, action instance, and readme editor instance.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as core from '@actions/core';
import { context as githubContext } from '@actions/github';
import nconf, { Provider } from 'nconf';
import YAML from 'yaml';

// Get Context type and constructor from the exported context instance
type Context = typeof githubContext;
const Context = githubContext.constructor as new () => Context;

import Action, { type Input } from './Action.js';
import {
  ConfigKeys,
  configFileName,
  GITHUB_ACTIONS_BRANDING_COLORS,
  GITHUB_ACTIONS_BRANDING_ICONS,
  README_SECTIONS,
  type ReadmeSection,
} from './constants.js';
import { repositoryFinder } from './helpers.js';
import LogTask from './logtask/index.js';
import ReadmeEditor from './readme-editor.js';

type IOptions = nconf.IOptions;

/**
 * Change working directory to output of workingDirectory()
 */
// process.chdir(workingDirectory());
export const metaActionPath = '../../action.yml';

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
 * Versioning source option configuration.
 * @property {string | string[]} alias - Alias(es) for the version_source option.
 * @property {string} describe - Description for the version_source option.
 * @property {boolean} parseValues - Specifies whether to parse values for the version_source option.
 * @property {string} type - Type of the version_source option.
 */
argvOptions[ConfigKeys.VersioningSource] = {
  alias: ['version-source', 'version_source', 'versioning_source'],
  describe:
    'How to detect the action version (git-tag, git-branch, git-sha, package-json, explicit)',
  parseValues: true,
  type: 'string',
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
 * README sections option configuration.
 * Declaring this as an array keeps a single `--sections=usage` value consistent
 * with the array shape used by `.ghadocs.json` and repeated CLI arguments.
 */
argvOptions.sections = {
  alias: 'sections',
  describe: 'Only generate the named README section (repeat for multiple sections)',
  type: 'array',
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
  version_source: ConfigKeys.VersioningSource,
  include_github_version_badge: ConfigKeys.IncludeGithubVersionBadge,
  owner: ConfigKeys.Owner,
  repo: ConfigKeys.Repo,
  title_prefix: ConfigKeys.TitlePrefix,
  pretty: ConfigKeys.Prettier,
  // Neither is an action.yml input, but nconf's argv store folds the CLI alias
  // onto the canonical nested key while the env transform does not — without
  // these, INPUT_DEBUG_CONFIG would land on a bare `debug_config` key that
  // nothing reads.
  debug_config: ConfigKeys.DebugConfig,
  debug_nconf: ConfigKeys.DebugNconf,
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
  _config: ProviderInstance,
  obj: KVPairType,
): undefined | KVPairType {
  /** The obj.key is always in lowercase, but it checks for it without case sensitivity */
  if (/^(INPUT|input)_[A-Z_a-z]\w*$/.test(obj.key)) {
    log.debug(`Parsing input: ${obj.key} with ith value: ${obj.value}`);
    const keyParsed = obj.key.replace(/^(INPUT|input)_/, '').toLocaleLowerCase();
    const key = ConfigKeysInputsMap[keyParsed] || keyParsed;

    // Skip empty values for owner/repo to allow fallback detection from .git/config or GITHUB_REPOSITORY
    if ((key === 'owner' || key === 'repo') && (!obj.value || obj.value === '')) {
      log.debug(`Ignoring empty ${key} input to allow auto-detection`);
      return undefined;
    }

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
      } does not match a known input. Known inputs are: ${Object.keys(ConfigKeysInputsMap).join(', ')}`,
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
  // This loads the defaults from THIS action's own action.yml file (github-action-readme-generator's action.yml)
  // NOT the user's action.yml file (which is loaded separately via the 'action' input parameter)
  // Therefore, we use import.meta.dirname to find this package's action.yml regardless of where it's installed
  const thisActionPath = path.join(import.meta.dirname, providedMetaActionPath ?? metaActionPath);
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
    // When running as a CLI tool (e.g., via npx or yarn dlx), the tool's own action.yml
    // may not be present in the node_modules. This is expected behavior, as the tool
    // should still work to generate documentation for other actions.
    log.debug(
      `Could not load defaults from this tool's action.yml at ${thisActionPath}: ${String(error)}`,
    );
    log.debug('Continuing without default values from action.yml');
    return {} as IOptions;
  }
}

/** Key fragments whose values are masked before the resolved config is printed. */
const SENSITIVE_KEY_PATTERN = /auth|credential|key|passw|secret|token/i;

/** Stand-in written in place of a masked value. */
export const REDACTED = '***REDACTED***';

/**
 * Nested allow-list of key paths, mirroring the shape of the resolved config.
 * `true` marks a leaf the tool reads; a nested object marks a group.
 */
/**
 * What a known key is allowed to hold. Declaring the shape per key, rather than
 * accepting anything scalar-ish everywhere, is what keeps a malformed value
 * from reaching the dump: `sections` is the only key that legitimately holds an
 * array, so an array under any other key came from a caller and nothing reads
 * it.
 */
type KnownLeaf = 'scalar' | 'section-names' | 'boolean' | 'version-source' | 'branding-hash';

type KnownKeyTree = { [key: string]: KnownKeyTree | KnownLeaf };

/**
 * `sections` is the one key holding an array, and its domain is the finite
 * {@link README_SECTIONS} set — `updateSection` ignores anything else. Naming
 * the leaf after that domain, rather than calling it a generic array, is what
 * lets an unrecognised entry be masked instead of printed.
 */
const SECTION_LIST_KEYS = new Set(['sections']);

/**
 * Keys whose declared domain is a boolean. No code path reads the bytes of a
 * value under one of these: the readers either compare against boolean literals
 * (`save.ts` on `=== true`; `isPrettierEnabled`, `getCurrentVersionString` and
 * `isDebugConfigEnabled` on `=== true || === 'true'`) or gate on truthiness
 * (`update-title.ts`, `update-badges.ts`), which consumes the value's
 * truthiness and nothing else.
 *
 * The domain comes from the key's contract, not from how its reader happens to
 * test it — `action.yml` declares `branding_as_title_prefix` as
 * `type: boolean` and `include_github_version_badge` with a boolean default,
 * so a string under either is malformed input whose content is never read.
 */
const BOOLEAN_KEYS: ReadonlySet<string> = new Set<string>([
  ConfigKeys.Save,
  ConfigKeys.Prettier,
  ConfigKeys.VersioningEnabled,
  ConfigKeys.BrandingAsTitlePrefix,
  ConfigKeys.IncludeGithubVersionBadge,
  ConfigKeys.DebugConfig,
  ConfigKeys.DebugNconf,
]);

/** The boolean forms nconf can hand back, parsed or still as a string. */
const BOOLEAN_VALUES: ReadonlySet<unknown> = new Set<unknown>([true, false, 'true', 'false']);

/**
 * `versioning:source` selects a detection strategy from a closed set;
 * `getCurrentVersionString` switches over these and treats anything else as
 * `git-tag`, so a value outside the set is never used for its content.
 */
const VERSION_SOURCE_KEYS: ReadonlySet<string> = new Set<string>([ConfigKeys.VersioningSource]);

/** The strategies `getCurrentVersionString` switches over. */
const VERSION_SOURCES: ReadonlySet<unknown> = new Set<unknown>([
  'git-tag',
  'git-branch',
  'git-sha',
  'package-json',
  'explicit',
]);

/**
 * `image_generated` caches the branding the SVG on disk was drawn from.
 *
 * It is the one key the tool writes and reads back that `ConfigKeys` does not
 * declare: `generateImgMarkup` sets it to `${icon}${color}` and, on a later
 * run, regenerates the SVG unless the saved value equals that same string.
 */
const BRANDING_HASH_KEYS: ReadonlySet<string> = new Set<string>(['image_generated']);

/**
 * Whether a value is a branding hash `generateImgMarkup`'s comparison can match.
 *
 * The icon and colour it concatenates come from closed sets, so the producible
 * hashes are a finite domain — the same reason `sections` and `versioning:source`
 * are validated against their contents rather than their shape. The two sets are
 * joined without a separator, so the colour is recovered by suffix.
 * @param {unknown} value - The value found under a branding-hash key.
 * @returns {boolean} True when the value is an icon name followed by a colour.
 */
function isBrandingHash(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return GITHUB_ACTIONS_BRANDING_COLORS.some(
    (color) =>
      value.endsWith(color) && GITHUB_ACTIONS_BRANDING_ICONS.has(value.slice(0, -color.length)),
  );
}

/**
 * Splits colon-separated config paths into the nested shape nconf resolves them
 * to, so `versioning:prefix` becomes `{ versioning: { prefix: 'scalar' } }`.
 * @param {readonly string[]} paths - Colon-separated key paths.
 * @returns {KnownKeyTree} The paths as a nested tree of declared shapes.
 */
function buildKnownKeyTree(paths: readonly string[]): KnownKeyTree {
  const tree: KnownKeyTree = {};
  for (const path of paths) {
    const segments = path.split(':');
    let node = tree;
    for (const [index, segment] of segments.entries()) {
      if (index === segments.length - 1) {
        if (SECTION_LIST_KEYS.has(path)) node[segment] = 'section-names';
        else if (BOOLEAN_KEYS.has(path)) node[segment] = 'boolean';
        else if (VERSION_SOURCE_KEYS.has(path)) node[segment] = 'version-source';
        else if (BRANDING_HASH_KEYS.has(path)) node[segment] = 'branding-hash';
        else node[segment] = 'scalar';
        break;
      }
      const next = node[segment];
      node = next === undefined || typeof next === 'string' ? (node[segment] = {}) : next;
    }
  }
  return tree;
}

/**
 * Canonical keys {@link ConfigKeys} declares that nothing in `src` reads, and
 * that no `action.yml` input or CLI flag can set. A value can only reach one of
 * them through `.ghadocs.json`, and no code path consumes it once there — so it
 * is a caller's value, not the tool's, and it is masked like any other unknown
 * key. Drop an entry from here once a reader for it lands.
 */
const UNREAD_CONFIG_KEYS: ReadonlySet<string> = new Set<string>([
  ConfigKeys.DebugReadme,
  ConfigKeys.DebugAction,
  ConfigKeys.DebugGithub,
]);

/**
 * Every key this tool resolves a value out of: the canonical config keys it
 * actually reads, plus `sections`, which `Inputs` sets and reads directly.
 *
 * The action-input and CLI spellings in {@link ConfigKeysInputsMap} are
 * deliberately absent. Those are input spellings, not resolved keys — the file
 * store performs no mapping, so `{"action": "…"}` in `.ghadocs.json` leaves a
 * bare `action` key that nothing ever reads, and listing it here would have
 * printed that value. Nothing is lost by masking them: when a value does arrive
 * through an alias, nconf's argv store records the canonical key too, so the
 * dump still shows it under `paths:action` / `debug:config`.
 */
const KNOWN_KEY_TREE: KnownKeyTree = buildKnownKeyTree([
  ...Object.values(ConfigKeys).filter((key) => !UNREAD_CONFIG_KEYS.has(key)),
  'sections',
  ...BRANDING_HASH_KEYS,
]);

/**
 * Whether a value is shaped like something a known leaf key can hold: a scalar,
 * or an array of scalars.
 *
 * Every key in {@link KNOWN_KEY_TREE} holds a scalar except `sections`, which
 * holds a string array. Anything richer arriving under one of those names came
 * from a caller, not from this tool, and nothing here reads it.
 * @param {unknown} value - The value found under a known leaf key.
 * @returns {boolean} True when the value is a scalar or an array of scalars.
 */
function isScalarLeafValue(value: unknown): boolean {
  return !Array.isArray(value) && (value === null || typeof value !== 'object');
}

/**
 * Whether a value is an array holding only scalars — the shape `sections` has.
 * @param {unknown} value - The value found under an array-valued key.
 * @returns {boolean} True for an array with no object or array elements.
 */
function isSectionNameList(value: unknown): boolean {
  const names = README_SECTIONS as readonly string[];
  return Array.isArray(value) && value.every((entry) => names.includes(entry as string));
}

/**
 * Masks every value the tool does not itself read, plus anything under a
 * sensitive-looking key, before the resolved config is printed.
 *
 * `action.yml` declares no secret input, and the env store admits only
 * `INPUT_*` keys, so ambient variables such as `GITHUB_TOKEN` never reach the
 * config. A caller can still land one: GitHub sets `INPUT_*` for every key
 * under `with:`, declared or not, and `.ghadocs.json` and CLI args are
 * user-controlled. The dump exists to be pasted into bug reports, so it masks
 * rather than relying on the runner's own secret masking.
 *
 * Because those three sources admit arbitrary keys, a name heuristic alone
 * cannot make the dump safe — `--webhook=https://hooks.example/...` carries a
 * credential under a name no pattern would flag. So the allow-list is the
 * primary defence: a key the tool reads is printed, anything else is masked.
 * That still shows a reporter which unexpected keys were supplied, without
 * printing what they held. `SENSITIVE_KEY_PATTERN` stays as a second line,
 * covering a future known key whose value is genuinely secret.
 *
 * Values under nconf and yargs bookkeeping keys (`_`, `$0`) are masked by the
 * same rule; they are not configuration and nothing reads them.
 *
 * Recurses so nested groups (`versioning:*`, `paths:*`) are covered. Arrays are
 * walked; a masked key's value is replaced whole rather than descended into.
 * @param {unknown} value - The resolved config, or a nested part of it.
 * @param {KnownKeyTree | true} known - Allow-list for this level; `true` means
 * every key below is already within a known leaf's value.
 * @returns {unknown} A copy with unknown and sensitive values masked.
 */
export function redactSensitiveValues(
  value: unknown,
  known: KnownKeyTree = KNOWN_KEY_TREE,
): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        return [key, REDACTED];
      }
      const branch = known[key];

      // Each known key declares the one shape it holds, and every other shape
      // is masked. The question a case answers is "is this the shape this key
      // holds?", never "is this value scalar-ish?" — the second admits an
      // object under a scalar key, a scalar under a group key, and an array
      // under a scalar key, each of them a value nothing reads, and closing
      // one of those leaves its mirror open.
      // The cases below are exhaustive over the tree. A leaf declares the
      // domain the key's contract gives it, not the shape its value happens to
      // have and not how its reader tests it: `scalar` is a shape, and the keys
      // that keep it are the ones whose value is read for its content.
      switch (branch) {
        case undefined: {
          // Not a key this tool reads. The config sources admit arbitrary keys,
          // so a credential can arrive under a name no pattern would flag.
          return [key, REDACTED];
        }
        case 'scalar': {
          return [key, isScalarLeafValue(entry) ? entry : REDACTED];
        }
        case 'section-names': {
          // Shape alone is not enough here: the domain is finite, so an entry
          // outside it is a value nothing reads, exactly like an unknown key.
          return [key, isSectionNameList(entry) ? entry : REDACTED];
        }
        case 'boolean': {
          // Finite for the same reason: the reader compares against boolean
          // literals, so anything else is a value it can never act on.
          return [key, BOOLEAN_VALUES.has(entry) ? entry : REDACTED];
        }
        case 'version-source': {
          return [key, VERSION_SOURCES.has(entry) ? entry : REDACTED];
        }
        case 'branding-hash': {
          return [key, isBrandingHash(entry) ? entry : REDACTED];
        }
        default: {
          // A group key names a nested mapping. Anything else under one is not
          // read out of any nested key.
          const isGroupShaped =
            entry !== null && typeof entry === 'object' && !Array.isArray(entry);
          return [key, isGroupShaped ? redactSensitiveValues(entry, branch) : REDACTED];
        }
      }
    }),
  );
}

/**
 * Whether the resolved nconf object was asked for.
 *
 * Two flags carry the identical promise "Print out the resolved nconf object
 * with all values" — `--debug_config` and the older `--debug_nconf` — so either
 * triggers the dump rather than one of them continuing to be inert.
 *
 * Unset means off, the opposite of `pretty`: this is a diagnostic, and neither
 * flag is declared in `action.yml`. The value arrives as a real boolean from
 * `.ghadocs.json` and as a string from env and CLI args, so both spellings are
 * accepted.
 * @param {ProviderInstance} config - The resolved config instance.
 * @returns {boolean} True when the resolved config should be printed.
 */
export function isDebugConfigEnabled(config: ProviderInstance): boolean {
  return [ConfigKeys.DebugConfig, ConfigKeys.DebugNconf].some((key) => {
    const value = config.get(key);
    return value === true || value === 'true';
  });
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

  // nconf resolves in the order stores are registered — the first store holding
  // a key wins. The order here is argv, then the config file, then env:
  //
  //   --pretty=false        beats  .ghadocs.json  beats  INPUT_PRETTY
  //
  // argv sits on top so an explicit CLI flag overrides `.ghadocs.json`, which it
  // previously could not.
  //
  // env stays *below* the file deliberately. When this runs as a GitHub Action
  // the runner exports an INPUT_* variable for every input carrying a default in
  // action.yml, whether or not the workflow named it under `with:` — so
  // INPUT_PRETTY=true and INPUT_README=README.md are present on essentially
  // every run. Registering env above the file would let those metadata defaults
  // outrank `.ghadocs.json`, leaving a project unable to set a custom readme
  // path or disable formatting from its persisted config.
  //
  // The cost is that an explicit `with:` entry also sits below the file, since
  // the runner flattens "set by the workflow" and "action.yml default" into the
  // same INPUT_* variable with nothing to tell them apart.
  config.argv(argvOptions);

  if (configFilePath) {
    if (fs.existsSync(configFilePath)) {
      log.info(`Config file found: ${configFilePath}`);
      config.file(configFilePath);
    } else {
      log.debug(`Config file not found: ${configFilePath}`);
    }
  }

  config.env({
    lowerCase: true,
    parseValues: true,
    transform: (obj: KVPairType): undefined | KVPairType => {
      return transformGitHubInputsToArgv(log, config, obj);
    },
  });

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

  // Get the action path to derive the target repo directory for .git/config lookup
  const actionPath = config.get(ConfigKeys.pathsAction) as string | undefined;
  const actionDir = actionPath ? path.dirname(path.resolve(actionPath)) : undefined;
  log.debug(`Action directory for repository detection: ${actionDir ?? 'not specified'}`);

  const repositoryDetail = repositoryFinder(`${ownerInput}/${repoInput}`, context, actionDir);
  log.debug(`repositoryDetail: ${JSON.stringify(repositoryDetail)}`);
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

    // `loadDefaultConfig` calls `repositoryFinder`, which throws "No owner or
    // repo found" when the tool runs outside a git checkout with no explicit
    // owner/repo and no GitHub context. That is one of the two failures this
    // flag exists to diagnose, so the dump has to survive it — without this the
    // flag printed nothing at all on that path.
    try {
      loadDefaultConfig(log, this.config);
    } catch (error) {
      this.dumpResolvedConfig();
      throw error;
    }

    // The other one: `loadRequiredConfig` throws when a required value is
    // missing, so the dump goes before it while it can still be printed.
    this.dumpResolvedConfig();

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

  /**
   * Prints the resolved configuration when `--debug_config` (or the older
   * `--debug_nconf`) asked for it.
   *
   * Called from two places in the constructor because both of the failures this
   * flag diagnoses throw, and each throws from a different call — see the
   * comments at those call sites. Rerunning it after a successful
   * `loadDefaultConfig` is the only path that reaches the second call, so no
   * run prints the dump twice.
   * @returns {void}
   */
  private dumpResolvedConfig(): void {
    if (isDebugConfigEnabled(this.config)) {
      this.log.info(`Resolved config:\n${this.stringify()}`);
    }
  }

  stringify(): string {
    if (this?.config) {
      try {
        return YAML.stringify(redactSensitiveValues(this.config.get()));
      } catch (error) {
        this.log.error(`${String(error)}`);
        // continue
      }
    }
    // this is just for debug, no need to stop the process if it fails
    return '';
  }
}
