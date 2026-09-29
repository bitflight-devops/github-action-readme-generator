/**
 * This TypeScript code exports a function named 'updateDescription' which takes a sectionToken (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the description section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes.
 * @param {ReadmeSection} sectionToken - The sectionToken representing the section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import type { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';

import LogTask from '../logtask/index.js';

/**
 * Converts an action.yml description to the Markdown of the description
 * section.
 *
 * The description is block Markdown, so it is kept as written: blank lines,
 * indentation and fenced code blocks all carry structure — see #711.
 * Formatting it is prettier's job.
 * @param {string} description - The description from action.yml.
 * @returns {string} - The section's Markdown.
 */
export function descriptionMarkdown(description: string): string {
  return description.trim().replaceAll('\r\n', '\n');
}

export default function updateDescription(
  sectionToken: ReadmeSection,
  inputs: Inputs,
): Record<string, string> {
  const log = new LogTask(sectionToken);

  // Build the new README
  const content: string[] = [];

  // Build the new description section
  if (inputs?.action?.description) {
    log.start();
    const desc = descriptionMarkdown(inputs.action.description);

    log.info(`Writing ${desc.length} characters to the description section`);
    content.push(desc);
    inputs.readmeEditor.updateSection(sectionToken, content);
    log.success();
  }
  const ret: Record<string, string> = {};
  ret[sectionToken] = content.join('\n');
  return ret;
}
