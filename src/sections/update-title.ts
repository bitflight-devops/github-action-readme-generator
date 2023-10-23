import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';
import { generateImgMarkup } from './update-branding.js';

export default function updateTitle(token: string, inputs: Inputs): void {
  const log = new LogTask(token);
  // Build the new README
  const content: string[] = [];
  let name = '';
  let svgInline = '';
  if (inputs.action.name) {
    log.start();
    name = inputs.action.name;
    if (inputs.config.get('branding_as_title_prefix') as boolean) {
      svgInline = `${generateImgMarkup(inputs, '60px')} `;
    }
    log.info(`Writing ${name.length} characters to the title`);
    const title = `# ${svgInline}${inputs.config.get('title_prefix') as string}${
      inputs.action.name
    }`;
    log.info(`Title: ${title}`);
    // Build the new usage section
    content.push(title);

    inputs.readmeEditor.updateSection(token, content, true);
    log.success();
  }
}
