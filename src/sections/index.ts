import type Inputs from '../inputs';
import LogTask from '../logtask';
import updateDescription from './update-description';
import updateInputs from './update-inputs';
import updateOutputs from './update-outputs';
import updateTitle from './update-title';
import updateUsage from './update-usage';

export default function updateSection(section: string, inputs: Inputs): void {
  const log = new LogTask('updateSection');
  try {
    switch (section) {
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
  } catch (error: any) {
    if (error && 'message' in error && error.message) log.fail(error.message as string);
  }
}
