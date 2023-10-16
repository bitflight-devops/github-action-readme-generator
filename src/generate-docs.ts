import Inputs from './inputs';
import LogTask from './logtask';
import save from './save';
import updateSection from './sections';

export const inputs = new Inputs();
// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export default function generateDocs(): void {
  const log = new LogTask('generating readme');

  for (const section of inputs.sections) {
    try {
      updateSection(section, inputs);
    } catch (error: any) {
      if (error && 'message' in error && error.message)
        log.error(`Error occured in section ${section}. ${error.message}`);
    }
  }
  inputs.readmeEditor.dumpToFile();

  save(inputs);
}
