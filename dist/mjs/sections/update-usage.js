import { getCurrentVersionString } from '../helpers.js';
import LogTask from '../logtask/index.js';
import { wrapDescription } from '../prettier.js';
export default function updateUsage(token, inputs) {
    const log = new LogTask(token);
    log.start();
    const actionName = `${inputs.config.get('owner')}/${inputs.config.get('repo')}`;
    log.info(`Action name: ${actionName}`);
    const versionString = getCurrentVersionString(inputs);
    log.info(`Version string: ${versionString}`);
    const actionReference = `${actionName}@${versionString}`;
    if (!actionReference) {
        throw new Error('Parameter actionReference must not be empty');
    }
    // Build the new README
    const content = [];
    // Build the new usage section
    content.push('```yaml', `- uses: ${actionReference}`, '  with:');
    const inp = inputs.action.inputs;
    let firstInput = true;
    if (inp) {
        for (const key of Object.keys(inp)) {
            const input = inp[key];
            if (input !== undefined) {
                // Line break between inputs
                if (!firstInput) {
                    content.push('');
                }
                // Constrain the width of the description, and append it
                wrapDescription(input.description, content, '    # ');
                if (input.default !== undefined) {
                    // Append blank line if description had paragraphs
                    if (input.description?.trimEnd().match(/\n *\r?\n/)) {
                        content.push('    #');
                    }
                    // Default
                    content.push(`    # Default: ${input.default}`);
                }
                // Input name
                content.push(`    ${key}: ''`);
                firstInput = false;
            }
        }
    }
    content.push('```\n');
    inputs.readmeEditor.updateSection(token, content);
    log.success();
}
//# sourceMappingURL=update-usage.js.map