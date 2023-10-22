/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import * as fs from 'node:fs';

import YAML from 'yaml';

import LogTask from './logtask/index.js';

export interface InputType {
  description?: string;
  required?: boolean;
  default?: string;
}
export interface OutputType {
  description?: string;
}
export interface Runs {
  using: string;
  main: string;
}
export interface Branding {
  color: string;
  icon: string;
}
export type InputsType = { [id: string]: InputType };
export type OutputsType = { [id: string]: OutputType };

export default class Action {
  // Load the action.yml

  public name: string;

  public description: string;

  public branding: Branding;

  public inputs: InputsType;

  public outputs: OutputsType;

  public runs: Runs;

  constructor(actionPath: string) {
    const log = new LogTask('action');
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

  inputDefault(inputName: string): string | undefined {
    return this.inputs[inputName]?.default;
  }

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
