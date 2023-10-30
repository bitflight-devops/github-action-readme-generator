/**
 * This class represents the metadata of a GitHub action defined in the action.yml file.
 * It provides properties and methods for accessing and manipulating the metadata.
 * [Further reading on the metadata can be found here](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs)
 */

import * as fs from 'node:fs';

import YAML from 'yaml';

import { type Branding, DEFAULT_BRAND_COLOR, DEFAULT_BRAND_ICON } from './constants.js';
import LogTask from './logtask/index.js';

/**
 * Represents an input for the action.
 */
export interface Input {
  /** Description of the input */
  description?: string;

  /** Whether the input is required */
  required?: boolean;

  /** Default value for the input */
  default?: string;
  /** Optional If the input parameter is used, this string is logged as a warning message. You can use this warning to notify users that the input is deprecated and mention any alternatives. */
  deprecationMessage?: string;
}

/**
 * Represents an output for the action.
 */
export interface Output {
  /** Description of the output */
  description?: string;
  value?: string;
}
type CompositeAction = 'composite';
type ContainerAction = 'container';
type JavascriptAction = `Node${string}` | `node${string}`;

/**
 * Defines the runs property for container actions.
 */
interface RunsContainer {
  using: ContainerAction;
  image: string;
  main: string;
  pre: string;
}

/**
 * Defines the runs property for JavaScript actions.
 */
interface RunsJavascript {
  /** The runner used to execute the action */
  'using': JavascriptAction;

  /** The entrypoint file for the action */
  'main': string;

  'pre'?: string;
  'pre-if'?: string;

  'post-if'?: string;

  'post'?: string;
}

/**
 * Defines the steps property for composite actions.
 */
interface Steps {
  'shell'?: string;
  'if'?: string;
  'run'?: string;
  'name'?: string;
  'id'?: string;
  'working-directory'?: string;
  'env': { [key: string]: string };
}

/**
 * Defines the runs property for composite actions.
 */
interface RunsComposite {
  /** The runner used to execute the action */
  using: CompositeAction;
  steps?: Steps;
}

export type ActionType = RunsContainer | RunsJavascript | RunsComposite;
/**
 * Defines how the action is run.
 */

// type FilterByField<T, K extends keyof T, V> = T extends { [P in K]: V } ? T : never;

/**
 * Parses and represents metadata from action.yml.
 */
export default class Action {
  // Load the action.yml

  /** Name of the action */
  name: string;

  author: string;

  /** Description of the action */
  description: string;

  /** Branding information */
  branding: Branding;

  /** Input definitions */
  inputs: { [key: string]: Input };

  /** Output definitions */
  outputs: { [key: string]: Output };

  /** How the action is run */
  runs: ActionType;

  /** Path to the action */
  path: string;

  /**
   * Creates a new instance of the Action class by loading and parsing action.yml.
   *
   * @param actionPath The path to the action.yml file.
   */
  constructor(actionPath: string) {
    // Load and parse action.yml
    const log = new LogTask('action');
    this.path = actionPath;

    try {
      log.debug(`Loading action.yml from ${actionPath}`);
      const actionString = fs.readFileSync(actionPath, 'utf8');
      const actionYaml = YAML.parse(actionString) as Action;
      log.success('Loaded configuration successfully');

      this.name = actionYaml.name;
      this.author = actionYaml.author;
      this.description = actionYaml.description;

      this.branding = {
        color: actionYaml.branding?.color ?? DEFAULT_BRAND_COLOR,
        icon: actionYaml.branding?.icon ?? DEFAULT_BRAND_ICON,
      };
      this.inputs = actionYaml.inputs;
      this.outputs = actionYaml.outputs;
      this.runs = actionYaml.runs;
    } catch (error) {
      log.fail(`Failed to load ${actionPath}`);
      throw error;
    }
  }

  /**
   * Gets the default value for an input.
   *
   * @param inputName The name of the input.
   * @returns The default value if defined,or undefined
   */
  inputDefault(inputName: string): string | boolean | undefined {
    return this.inputs[inputName]?.default ?? undefined;
  }

  /**
   * Stringifies the action back to YAML.
   *
   * @returns The YAML string for debugging.
   */
  stringify(): string {
    try {
      return YAML.stringify(this);
    } catch (error) {
      const log = new LogTask('action:stringify');
      log.error(`Failed to stringify action.yml. Error: ${error}`);
      return '';
    }
  }
}
