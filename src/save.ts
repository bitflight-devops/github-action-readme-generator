import * as nconf from 'nconf';

import { configKeys } from './inputs';
import LogTask from './logtask';

// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export default function save(): void {
  const log = new LogTask('save');
  if (nconf.get('save').toString() === 'true') {
    for (const k of Object.keys(configKeys)) {
      nconf.set(k, nconf.get(k));
    }
    nconf.save((err: any) => {
      if (err && 'message' in err && err.message) {
        log.error(err.message as string);
        return;
      }
      log.info('Configuration saved successfully.');
    });
  }
}
