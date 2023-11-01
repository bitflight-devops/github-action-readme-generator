/**
 * This TypeScript code imports various modules and defines a function named 'generateDocs'.
 * The function is responsible for generating documentation for the README.md file based on the provided inputs.
 * It iterates through each section defined in the 'inputs.sections' array and calls the 'updateSection' function to update the corresponding section in the README.md file.
 * If an error occurs during the update of a section, it logs the error message and stops the process.
 * Finally, it saves the updated README.md file and calls the 'save' function.
 */
import Inputs from './inputs.js';
import LogTask from './logtask/index.js';
import save from './save.js';
import updateSection from './sections/index.js';
export const inputs = new Inputs();
/**
 * Generates documentation for the README.md file.
 * @returns {Promise<void>} A promise that resolves once the documentation is generated.
 */
export async function generateDocs() {
    const log = new LogTask('generating readme');
    const sectionPromises = [];
    for (const section of inputs.sections) {
        sectionPromises.push(updateSection(section, inputs).catch((error) => {
            if (error) {
                throw new Error(`Problem in ${section}. ${error}`);
            }
        }));
    }
    try {
        await Promise.all(sectionPromises);
        await inputs.readmeEditor.dumpToFile();
        return save(inputs);
    }
    catch (error) {
        return log.fail(`${error}`);
    }
}
//# sourceMappingURL=generate-docs.js.map