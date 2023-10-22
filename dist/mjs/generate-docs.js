import Inputs from './inputs.js';
import LogTask from './logtask/index.js';
import save from './save.js';
import updateSection from './sections/index.js';
export const inputs = new Inputs();
// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export function generateDocs() {
    const log = new LogTask('generating readme');
    for (const section of inputs.sections) {
        try {
            updateSection(section, inputs);
        }
        catch (error) {
            if (error && 'message' in error && error.message)
                return log.fail(`Error occured in section ${section}. ${error.message}`);
        }
    }
    inputs.readmeEditor.dumpToFile();
    save(inputs);
}
//# sourceMappingURL=generate-docs.js.map