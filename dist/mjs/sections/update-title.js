import LogTask from '../logtask/index.js';
export default function updateTitle(token, inputs) {
    const log = new LogTask(token);
    // Build the new README
    const content = [];
    let name = '';
    if (inputs.action.name) {
        log.start();
        name = inputs.action.name;
        log.info(`Writing ${name.length} characters to the title`);
        const title = `# ${inputs.config.get('title_prefix')}${inputs.action.name}`;
        log.info(`Title: ${title}`);
        // Build the new usage section
        content.push(title);
        inputs.readmeEditor.updateSection(token, content);
        log.success();
    }
}
//# sourceMappingURL=update-title.js.map