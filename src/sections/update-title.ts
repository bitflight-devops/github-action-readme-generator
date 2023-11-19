/**
 * This TypeScript code exports a function named 'updateTitle' which takes a sectionToken (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the title section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes, the 'generateImgMarkup' function from './update-branding.js' for generating image markup.
 * @param {ReadmeSection} sectionToken - The sectionToken representing the section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';
import { generateImgMarkup } from './update-branding.js';

export default function updateTitle(
  sectionToken: ReadmeSection,
  inputs: Inputs,
): Record<string, string> {
  const log = new LogTask(sectionToken);

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
    inputs.readmeEditor.updateSection(sectionToken, content, true);

    log.success();
  }
  const ret: Record<string, string> = {};
  ret[sectionToken] = content.join('\n');
  return ret;
}
