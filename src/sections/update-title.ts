import * as nconf from 'nconf'

import {action, readmePath} from '../inputs'
import LogTask from '../logtask'
import updateReadme from '../readme-writer'

export default function updateTitle(token: string): void {
  const log = new LogTask(token)
  // Build the new README
  const content: string[] = []
  let name = ''
  if (action.name) {
    name = action.name
  }
  log.info(`Writing ${name.length} characters to the title`)
  const title = `# ${nconf.get('title_prefix') as string}${action.name}`
  log.info(`Title: ${title}`)
  // Build the new usage section
  content.push(title)

  updateReadme(content, token, readmePath)
}
