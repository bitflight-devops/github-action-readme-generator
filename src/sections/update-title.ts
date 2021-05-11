import * as nconf from 'nconf'

import {actionYaml} from '../action-loader'
import {readmePath} from '../inputs'
import {LogTask} from '../logtask'
import {updateReadme} from '../readme-writer'

export function updateTitle(token: string): void {
  const log = new LogTask(token)
  // Build the new README
  const content: string[] = []
  let name = ''
  if (actionYaml.name) {
    name = actionYaml.name
  }
  log.info(`Writing ${name.length} characters to the title`)
  const title = `# ${nconf.get('title_prefix') as string}${actionYaml.name}`
  log.info(`Title: ${title}`)
  // Build the new usage section
  content.push(title)

  updateReadme(content, token, readmePath)
}
