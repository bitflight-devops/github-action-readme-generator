import {sections} from './inputs'
import {LogTask} from './logtask'
import {save} from './save'
import {updateSection} from './sections'
// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export function generateDocs(): void {
  const log = new LogTask('generating readme')
  try {
    log.title()
    for (const section of sections) {
      updateSection(section)
    }
    save()
  } catch (err) {
    log.error(err.message)
  }
}
