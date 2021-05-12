/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import * as fs from 'fs'
import * as yaml from 'js-yaml'

import LogTask from './logtask'

export interface Input {
  description?: string
  required?: boolean
  default?: string
}
export interface Output {
  description?: string
}
export interface Runs {
  using: string
  main: string
}
export interface Branding {
  color: string
  icon: string
}
export type Inputs = {[id: string]: Input}
export type Outputs = {[id: string]: Output}

export default class Action {
  // Load the action.yml

  public name: string
  public description: string
  public branding: Branding
  public inputs: Inputs
  public outputs: Outputs
  public runs: Runs

  constructor(actionPath: string) {
    const log = new LogTask('action')
    let _actionYaml = null
    try {
      log.debug(`loading action.yml from ${actionPath}`)
      _actionYaml = yaml.load(fs.readFileSync(actionPath, 'utf8')) as Action
      log.success('loaded successfully', false)
    } catch (err) {
      log.fail(`failed to load ${actionPath}`, false)
    }
    if (typeof _actionYaml !== 'object' || _actionYaml === null) {
      log.fail(`action.yml file read in isn't an object (no yaml in it)`)
    }
    const actionYaml = _actionYaml as Action
    this.name = actionYaml.name
    this.description = actionYaml.description
    this.branding = actionYaml.branding
    this.inputs = actionYaml.inputs
    this.outputs = actionYaml.outputs
    this.runs = actionYaml.runs
  }
}
