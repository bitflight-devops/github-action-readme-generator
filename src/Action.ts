/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
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

  /**
   * The type of the input.
   */
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
 * Defines how the action is run.
 */
interface RunsContainer {
  using: ContainerAction;
  image: string;
  main: string;
  pre: string;
}

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

interface Steps {
  'shell'?: string;
  'if'?: string;
  'run'?: string;
  'name'?: string;
  'id'?: string;
  'working-directory'?: string;
  'env': { [key: string]: string };
}

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
  public name: string;

  public author: string;

  /** Description of the action */
  public description: string;

  /** Branding information */
  public branding: Branding;

  /** Input definitions */
  public inputs: { [key: string]: Input };

  /** Output definitions */
  public outputs: { [key: string]: Output };

  /** How the action is run */
  public runs: ActionType;

  /** Path to the action */
  public path: string;

  /**
   * Creates a new Action instance by loading and parsing action.yml.
   *
   * @param actionPath Path to the action
   */
  constructor(actionPath: string) {
    // Load and parse action.yml
    const log = new LogTask('action');
    this.path = actionPath;
    let tmpActionYaml = null;
    try {
      log.debug(`loading action.yml from ${actionPath}`);
      const actionString = fs.readFileSync(actionPath, 'utf8');
      tmpActionYaml = YAML.parse(actionString) as Action;
      log.success('loaded configuration successfully');
    } catch {
      log.error(`failed to load ${actionPath}`);
    }
    if (typeof tmpActionYaml !== 'object' || tmpActionYaml === null) {
      log.error("action.yml file read in isn't an object (no yaml in it)");
    }
    const actionYaml = tmpActionYaml as Action;
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
  }

  /**
   * Gets the default value for an input.
   *
   * @param inputName Name of the input
   * @returns The default value if defined
   */
  inputDefault(inputName: string): string | boolean | undefined {
    return this.inputs[inputName]?.default;
  }

  /**
   * Stringifies the action back to YAML.
   *
   * @returns The YAML string
   */
  stringify(): string {
    try {
      return YAML.stringify(this);
    } catch {
      const log = new LogTask('action:stringify');
      log.error('failed to stringify action.yml');
      return '';
    }
  }
}
