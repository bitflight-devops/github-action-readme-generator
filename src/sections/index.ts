import {LogTask} from '../logtask'
import {updateDescription} from './update-description'
import {updateTitle} from './update-title'
import {updateUsage} from './update-usage'

export function updateSection(section: string): void {
  const log = new LogTask(section)
  try {
    if (section === 'usage') {
      log.start()
      updateUsage(section)
      log.success()
    } else if (section === 'title') {
      log.start()
      updateTitle(section)
      log.success()
    } else if (section === 'description') {
      log.start()
      updateDescription(section)
      log.success()
    }
  } catch (err) {
    log.fail(err.message)
  }
}
