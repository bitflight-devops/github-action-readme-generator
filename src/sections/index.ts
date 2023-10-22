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
export default function updateSection(section: string, inputs: Inputs): void {
  const [startToken, stopToken] = inputs.readmeEditor.getTokenIndexes(section);
  if (startToken === -1 || stopToken === -1) return;
  switch (section) {
    case 'branding': {
      updateBranding(section, inputs);
      break;
    }
    case 'badges': {
      updateBadges(section, inputs);
      break;
    }
    case 'usage': {
      updateUsage(section, inputs);
      break;
    }
    case 'title': {
      updateTitle(section, inputs);
      break;
    }
    case 'description': {
      updateDescription(section, inputs);
      break;
    }
    case 'inputs': {
      updateInputs(section, inputs);
      break;
    }
    case 'outputs': {
      updateOutputs(section, inputs);
      break;
    }
    default: {
      log.debug(`unknown section ${section}`);
    }
  }
}
