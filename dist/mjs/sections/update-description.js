import LogTask from '../logtask/index.js';
export default function updateDescription(sectionToken, inputs) {
    const log = new LogTask(sectionToken);
    // Build the new README
    const content = [];
    // Build the new description section
    if (inputs?.action?.description) {
        log.start();
        const desc = inputs.action.description
            .trim()
            .replaceAll('\r\n', '\n') // Convert CR to LF
            .replaceAll(/ +/g, ' ') // Squash consecutive spaces
            .replaceAll(' \n', '\n') // Squash space followed by newline
            .replaceAll('\n\n', '<br />'); // Convert double return to a break
        log.info(`Writing ${desc.length} characters to the description section`);
        content.push(desc);
        inputs.readmeEditor.updateSection(sectionToken, content);
        log.success();
    }
    const ret = {};
    ret[sectionToken] = content.join('\n');
    return ret;
}
//# sourceMappingURL=update-description.js.map