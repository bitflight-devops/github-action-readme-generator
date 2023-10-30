/**
 * This TypeScript code exports a function named 'updateDescription' which takes a token (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the description section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes.
 * @param {ReadmeSection} token - The token representing the section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';

export default function updateDescription(token: ReadmeSection, inputs: Inputs): void {
  const log = new LogTask(token);

  // Build the new README
  const content: string[] = [];

  // Build the new description section
  if (inputs?.action?.description) {
    log.start();
    const desc: string = inputs.action.description
      .trim()
      .replaceAll('\r\n', '\n') // Convert CR to LF
      .replaceAll(/ +/g, ' ') // Squash consecutive spaces
      .replaceAll(' \n', '\n') // Squash space followed by newline
      .replaceAll('\n\n', '<br />'); // Convert double return to a break

    log.info(`Writing ${desc.length} characters to the description section`);
    content.push(desc);
    inputs.readmeEditor.updateSection(token, content);
    log.success();
  }
}
