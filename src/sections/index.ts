import type Inputs from '../inputs';
import LogTask from '../logtask';
import updateDescription from './update-description';
import updateInputs from './update-inputs';
import updateOutputs from './update-outputs';
import updateTitle from './update-title';
import updateUsage from './update-usage';

export default function updateSection(section: string, inputs: Inputs): void {
  const log = new LogTask(section);
  try {
    if (section === 'usage') {
      log.start();
      updateUsage(section, inputs);
      log.success();
    } else if (section === 'title') {
      log.start();
      updateTitle(section, inputs);
      log.success();
    } else if (section === 'description') {
      log.start();
      updateDescription(section, inputs);
      log.success();
    } else if (section === 'inputs') {
      log.start();
      updateInputs(section, inputs);
      log.success();
    } else if (section === 'outputs') {
      log.start();
      updateOutputs(section, inputs);
      log.success();
    }
  } catch (err: any) {
    if (err && 'message' in err && err.message) log.fail(err.message as string);
  }
}
