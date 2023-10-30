/**
 * This TypeScript code exports a function named 'updateSection' which takes a section (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating different sections of the README.md file based on the provided section input.
 * It utilizes various update functions (e.g., updateBranding, updateBadges) to update specific sections.
 * @param {ReadmeSection} section - The section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 * @returns {Promise<void>} A promise that resolves once the section is updated.
 */
import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';
import updateBadges from './update-badges.js';
import updateBranding from './update-branding.js';
import updateDescription from './update-description.js';
import updateInputs from './update-inputs.js';
import updateOutputs from './update-outputs.js';
import updateTitle from './update-title.js';
import updateUsage from './update-usage.js';

const log = new LogTask('updateSection');

export default async function updateSection(section: ReadmeSection, inputs: Inputs): Promise<void> {
  const [startToken, stopToken] = inputs.readmeEditor.getTokenIndexes(section);
  // &&
  // ['branding', 'title'].includes(section) &&
  // inputs.config.get('branding_as_title_prefix') !== true
  if (startToken === -1 || stopToken === -1) {
    return;
  }
  switch (section) {
    case 'branding': {
      return updateBranding(section, inputs);
    }
    case 'badges': {
      return updateBadges(section, inputs);
    }
    case 'usage': {
      return updateUsage(section, inputs);
    }
    case 'title': {
      return updateTitle(section, inputs);
    }
    case 'description': {
      return updateDescription(section, inputs);
    }
    case 'inputs': {
      return updateInputs(section, inputs);
    }
    case 'outputs': {
      return updateOutputs(section, inputs);
    }
    default: {
      return log.debug(`unknown section found <!-- start ${section} -->`);
    }
  }
}
