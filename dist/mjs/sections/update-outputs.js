import { columnHeader, rowHeader } from '../helpers.js';
import LogTask from '../logtask/index.js';
import markdowner from '../markdowner/index.js';
export default function updateOutputs(token, inputs) {
    const log = new LogTask(token);
    // Build the new README
    const content = [];
    const markdownArray = [];
    const titleArray = ['Output', 'Description'];
    const titles = [];
    for (const t of titleArray) {
        titles.push(columnHeader(t));
    }
    markdownArray.push(titles);
    const vars = inputs.action.outputs;
    const tI = vars ? Object.keys(vars).length : 0;
    if (tI > 0) {
        log.start();
        for (const key of Object.keys(vars)) {
            const values = vars[key];
            let description = values?.description ?? '';
            // Check if only first line should be added (only subject without body)
            // eslint-disable-next-line no-useless-escape
            const matches = /(.*?)\n\n([Ss]*)/.exec(description);
            if (matches && matches.length >= 2) {
                description = matches[1] || description;
            }
            description = description.trim().replace('\n', '<br />');
            const row = [rowHeader(key), description];
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
//# sourceMappingURL=update-outputs.js.map