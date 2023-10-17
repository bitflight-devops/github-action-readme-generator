import LogTask from '../logtask/index.js';
import SVGEditor, { GITHUB_ACTIONS_BRANDING_ICONS } from '../svg-editor.mjs';
function featherType(iconName) {
    return iconName;
}
/**
 * Generates a svg branding image.
 */
function generateSvgImage(svgPath, icon, bgcolor) {
    const svgEditor = new SVGEditor();
    svgEditor.generateSvgImage(svgPath, icon, bgcolor);
    //   const svgOut = [
    //     '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    //     draw.svg(),
    //     '\n',
    //   ].join('\n');
    //   log.info(`SVG data to write: ${svgOut}`);
    //   fs.mkdirSync(path.dirname(svgPath), { recursive: true });
    //   fs.writeFileSync(svgPath, svgOut, { encoding: 'utf8' });
    // } catch (error) {
    //   log.error(`Error generating svg image: ${svgPath}. Error: ${error}`);
    // }
}
function generateImgMarkup(svgPath, brand) {
    return `<img src="${svgPath}" alt="${brand.icon ?? ''}" />`;
}
export default function updateBranding(token, inputs) {
    const log = new LogTask(token);
    const svgPath = inputs.config.get('github_action_branding_svg_path');
    log.info(`Brand details: ${JSON.stringify(inputs.action.branding)}`);
    const brand = inputs.action.branding;
    log.start();
    if (typeof brand.icon === 'string' && GITHUB_ACTIONS_BRANDING_ICONS.has(brand.icon)) {
        const iconName = featherType(brand.icon);
        log.info(`Generating action.yml branding image for ${iconName}`);
        generateSvgImage(svgPath, iconName, brand.color);
        const content = generateImgMarkup(svgPath, brand);
        inputs.readmeEditor.updateSection(token, content);
    }
    else {
        log.warn('No icon specified for branding in action.yml. Leaving section blank');
        inputs.readmeEditor.updateSection(token, '');
    }
    log.success();
}
//# sourceMappingURL=update-branding.js.map