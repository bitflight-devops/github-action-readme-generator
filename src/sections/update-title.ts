import * as nconf from 'nconf';

import type Inputs from '../inputs';
import LogTask from '../logtask';
import updateReadme from '../readme-writer';

export default function updateTitle(token: string, inputs: Inputs): void {
  const log = new LogTask(token);
  // Build the new README
  const content: string[] = [];
  let name = '';
  if (inputs.action.name) {
    log.start();
    name = inputs.action.name;

    log.info(`Writing ${name.length} characters to the title`);
    const title = `# ${nconf.get('title_prefix') as string}${inputs.action.name}`;
    log.info(`Title: ${title}`);
    // Build the new usage section
    content.push(title);

    updateReadme(content, token, inputs.readmePath);
    log.success();
  }
}
