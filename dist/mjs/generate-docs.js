import Inputs from './inputs.js';
import LogTask from './logtask/index.js';
import save from './save.js';
import updateSection from './sections/index.js';
export const inputs = new Inputs();
// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export async function generateDocs() {
    const log = new LogTask('generating readme');
    for (const section of inputs.sections) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await updateSection(section, inputs);
        }
        catch (error) {
            if (error && 'message' in error && error.message)
                return log.fail(`Error occured in section ${section}. ${error.message}`);
        }
    }
    inputs.readmeEditor.dumpToFile();
    return save(inputs);
}
//# sourceMappingURL=generate-docs.js.map