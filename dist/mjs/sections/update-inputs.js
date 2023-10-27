/**
 * This TypeScript code exports a function named 'updateInputs' which takes a token (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the inputs section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes, 'columnHeader' and 'rowHeader' functions from '../helpers.js' for formatting table headers, and 'markdowner' function from '../markdowner/index.js' for generating markdown content.
 * @param {ReadmeSection} token - The token representing the section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import { columnHeader, rowHeader } from '../helpers.js';
import LogTask from '../logtask/index.js';
import markdowner from '../markdowner/index.js';
export default function updateInputs(token, inputs) {
    const log = new LogTask(token);
    // Build the new README
    const content = [];
    const markdownArray = [];
    const titleArray = ['Input', 'Description', 'Default', 'Required'];
    const titles = [];
    for (const t of titleArray) {
        titles.push(columnHeader(t));
    }
    markdownArray.push(titles);
    const vars = inputs.action.inputs;
    const tI = vars ? Object.keys(vars).length : 0;
    if (tI > 0) {
        log.start();
        for (const key of Object.keys(vars)) {
            const values = vars[key];
            let description = values?.description ?? '';
            // Check if only the first line should be added (only subject without body)
            const matches = /(.*?)\n\n([Ss]*)/.exec(description);
            if (matches && matches.length >= 2) {
                description = matches[1] || description;
            }
            description = description.trim().replace('\n', '<br />');
            const row = [
                rowHeader(key),
                description,
                values?.default ? `<code>${values.default}</code>` : '',
                values?.required ? '**true**' : '__false__',
            ];
            log.debug(JSON.stringify(row));
            markdownArray.push(row);
        }
        content.push(markdowner(markdownArray));
        log.info(`Action has ${tI} total ${token}`);
        inputs.readmeEditor.updateSection(token, content);
        log.success();
    }
    else {
        log.debug(`Action has no ${token}`);
    }
}
//# sourceMappingURL=update-inputs.js.map