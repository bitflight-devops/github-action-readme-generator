import Inputs from './inputs';
import LogTask from './logtask';
import save from './save';
import updateSection from './sections';

export const inputs = new Inputs();
// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export default function generateDocs(): void {
  const log = new LogTask('generating readme');
  try {
    for (const section of inputs.sections) {
      updateSection(section, inputs);
    }
    save(inputs);
  } catch (error: any) {
    if (error && 'message' in error && error.message) log.error(error.message as string);
  }
}
