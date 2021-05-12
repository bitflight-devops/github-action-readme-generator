import * as fs from 'fs'
import * as yaml from 'js-yaml'
import * as path from 'path'

import {Action} from './generate-docs.d'
import {actionPath} from './inputs'
import {LogTask} from './logtask'
// Load the action.yml
const log = new LogTask('action.yml')
const _actionPath = path.resolve(actionPath)
let _actionYaml = null
try {
  _actionYaml = yaml.load(fs.readFileSync(_actionPath, 'utf8'))
  log.info('Loaded successfully')
} catch (err) {
  log.fail('Failed to load')
}
if (typeof _actionYaml !== 'object' || _actionYaml === null) {
  throw new Error(`Yaml file read in isn't an object`)
}
export const actionYaml = _actionYaml as Action
