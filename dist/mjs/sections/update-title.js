import LogTask from '../logtask/index.js';
import { generateImgMarkup } from './update-branding.js';
export default function updateTitle(sectionToken, inputs) {
    const log = new LogTask(sectionToken);
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
        inputs.readmeEditor.updateSection(sectionToken, content, true);
        log.success();
    }
    const ret = {};
    ret[sectionToken] = content.join('\n');
    return ret;
}
//# sourceMappingURL=update-title.js.map