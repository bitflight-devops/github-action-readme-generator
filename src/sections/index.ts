import type Inputs from '../inputs';
import LogTask from '../logtask';
import updateBadges from './update-badges';
import updateDescription from './update-description';
import updateInputs from './update-inputs';
import updateOutputs from './update-outputs';
import updateTitle from './update-title';
import updateUsage from './update-usage';

export default async function updateSection(section: string, inputs: Inputs): Promise<void> {
  const log = new LogTask('updateSection');
  try {
    switch (section) {
      case 'badges': {
        await updateBadges(section, inputs);
        break;
      }
      case 'usage': {
        await updateUsage(section, inputs);
        break;
      }
      case 'title': {
        await updateTitle(section, inputs);
        break;
      }
      case 'description': {
        await updateDescription(section, inputs);
        break;
      }
      case 'inputs': {
        await updateInputs(section, inputs);
        break;
      }
      case 'outputs': {
        await updateOutputs(section, inputs);
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
