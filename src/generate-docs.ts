import Inputs from './inputs';
import LogTask from './logtask';
import save from './save';
import updateSection from './sections';

export const inputs = new Inputs();
// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export default async function generateDocs(): Promise<void> {
  const log = new LogTask('generating readme');
  try {
    const sectionsPromises = [];
    for (const section of inputs.sections) {
      sectionsPromises.push(updateSection(section, inputs));
    }
    return Promise.all(sectionsPromises).then(() => save(inputs));
  } catch (error: any) {
    if (error && 'message' in error && error.message) log.error(error.message as string);
  }
}
