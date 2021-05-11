import * as nconf from 'nconf'

import {configKeys} from './inputs'
import {LogTask} from './logtask'

// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export function save(): void {
  const log = new LogTask('save')
  if (nconf.get('save').toString() === 'true') {
    for (const k of configKeys) {
      nconf.set(k, nconf.get(k))
    }
    nconf.save(function (err: any) {
      if (err) {
        log.error(err.message)
        return
      }
      log.info('Configuration saved successfully.')
    })
  }
}
