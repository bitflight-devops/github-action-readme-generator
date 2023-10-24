import LogTask from '../logtask/index.js';
import { generateImgMarkup } from './update-branding.js';
export default function updateTitle(token, inputs) {
    const log = new LogTask(token);
    // Build the new README
    const content = [];
    let name = '';
    let svgInline = '';
    if (inputs.action.name) {
        log.start();
        name = inputs.action.name;
        if (inputs.config.get('branding_as_title_prefix')) {
            svgInline = `${generateImgMarkup(inputs, '60px')} `;
        }
        log.info(`Writing ${name.length} characters to the title`);
        const title = `# ${svgInline}${inputs.config.get('title_prefix')}${inputs.action.name}`;
        log.info(`Title: ${title}`);
        // Build the new usage section
        content.push(title);
        inputs.readmeEditor.updateSection(token, content, true);
        log.success();
    }
}
//# sourceMappingURL=update-title.js.map