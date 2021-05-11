import {actionYaml} from '../action-loader'
import {readmePath} from '../inputs'
import {LogTask} from '../logtask'
import {updateReadme} from '../readme-writer'

export function updateDescription(token: string): void {
  const log = new LogTask(token)
  let desc = ''
  // Build the new README
  const content: string[] = []
  // Build the new description section
  if (actionYaml.description) {
    desc = actionYaml.description.replace('\n', '\n\n')
  }
  log.info(`Writing ${desc.length} characters to the description section`)
  content.push(desc)
  updateReadme(content, token, readmePath)
}
