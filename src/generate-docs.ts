import Inputs from './inputs';
import LogTask from './logtask';
import save from './save';
import updateSection from './sections';

export const inputs = new Inputs();
// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export default function generateDocs(): void {
  const log = new LogTask('generating readme');
  try {
    Object.keys(inputs.sections).forEach((section) => {
      updateSection(section, inputs);
    });
    save();
  } catch (err: any) {
    if (err && 'message' in err && err.message) log.error(err.message as string);
  }
}
