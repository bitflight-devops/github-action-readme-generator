import type Inputs from '../inputs';
import LogTask from '../logtask';
import updateReadme from '../readme-writer';

export default function updateDescription(token: string, inputs: Inputs): void {
  const log = new LogTask(token);
  let desc = '';
  // Build the new README
  const content: string[] = [];
  // Build the new description section
  if (inputs.action.description) {
    log.start();
    desc = inputs.action.description.replace('\n', '\n\n');

    log.info(`Writing ${desc.length} characters to the description section`);
    content.push(desc);
    updateReadme(content, token, inputs.readmePath);
    log.success();
  }
}
