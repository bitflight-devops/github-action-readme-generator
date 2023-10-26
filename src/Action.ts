/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import * as fs from 'node:fs';

import YAML from 'yaml';

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
}

/**
 * Represents an output for the action.
 */
export interface Output {
  /** Description of the output */
  description?: string;
}

/**
 * Defines how the action is run.
 */
interface Runs {
  /** The runner used to execute the action */
  using: string;

  /** The entrypoint file for the action */
  main: string;
}

/**
 * Branding information for the action.
 */
export interface Branding {
  /** Color for the action branding */
  color: string;
  icon: string;
}

/**
 * Parses and represents metadata from action.yml.
 */
export default class Action {
  // Load the action.yml

  /** Name of the action */
  public name: string;

  /** Description of the action */
  public description: string;

  /** Branding information */
  public branding: Branding;

  /** Input definitions */
  public inputs: { [key: string]: Input };

  /** Output definitions */
  public outputs: { [key: string]: Output };

  /** How the action is run */
  public runs: Runs;

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
    this.description = actionYaml.description;
    this.branding = actionYaml.branding;
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
  inputDefault(inputName: string): string | undefined {
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
