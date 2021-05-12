import * as fs from 'fs'
import * as yaml from 'js-yaml'

import {Action} from './generate-docs.d'
import {actionPath} from './inputs'
import {LogTask} from './logtask'

// Load the action.yml
const log = new LogTask('action.yml')

let _actionYaml = null
try {
  _actionYaml = yaml.load(fs.readFileSync(actionPath, 'utf8'))
  log.info('Loaded successfully')
} catch (err) {
  log.fail('Failed to load')
}
if (typeof _actionYaml !== 'object' || _actionYaml === null) {
  log.fail(`action.yml file read in isn't an object (no yaml in it)`)
}
export const actionYaml = _actionYaml as Action
