import LogTask from '../logtask/index.js';
export default function updateDescription(token, inputs) {
    const log = new LogTask(token);
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
        inputs.readmeEditor.updateSection(token, content);
        log.success();
    }
}
//# sourceMappingURL=update-description.js.map