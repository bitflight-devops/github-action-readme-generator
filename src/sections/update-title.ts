import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';

export default function updateTitle(token: string, inputs: Inputs): void {
  const log = new LogTask(token);
  // Build the new README
  const content: string[] = [];
  let name = '';
  if (inputs.action.name) {
    log.start();
    name = inputs.action.name;

    log.info(`Writing ${name.length} characters to the title`);
    const title = `# ${inputs.config.get('title_prefix') as string}${inputs.action.name}`;
    log.info(`Title: ${title}`);
    // Build the new usage section
    content.push(title);

    inputs.readmeEditor.updateSection(token, content);
    log.success();
  }
}
