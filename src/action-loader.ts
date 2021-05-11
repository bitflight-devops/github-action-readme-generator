import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as path from 'path'

import {Action} from './generate-docs.d'
import {actionPath} from './inputs'

const actionDir = path.resolve(process.cwd())

// Load the action.yml
const _actionYaml = yaml.load(fs.readFileSync(path.resolve(actionDir, actionPath), 'utf8').toString())
if (typeof _actionYaml !== 'object' || _actionYaml === null) {
  throw new Error(`Yaml file read in isn't an object`)
}
export const actionYaml = _actionYaml as Action
