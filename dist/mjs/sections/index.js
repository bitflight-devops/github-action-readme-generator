import LogTask from '../logtask/index.js';
import updateBadges from './update-badges.js';
import updateBranding from './update-branding.js';
import updateContents from './update-contents.js';
import updateDescription from './update-description.js';
import updateInputs from './update-inputs.js';
import updateOutputs from './update-outputs.js';
import updateTitle from './update-title.js';
import updateUsage from './update-usage.js';
const log = new LogTask('updateSection');
export default async function updateSection(section, inputs) {
    const [startToken, stopToken] = inputs.readmeEditor.getTokenIndexes(section);
    // &&
    // ['branding', 'title'].includes(section) &&
    // inputs.config.get('branding_as_title_prefix') !== true
    if (startToken === -1 || stopToken === -1) {
        return {};
    }
    switch (section) {
        case 'branding': {
            return await updateBranding(section, inputs);
        }
        case 'badges': {
            return await updateBadges(section, inputs);
        }
        case 'usage': {
            return await updateUsage(section, inputs);
        }
        case 'title': {
            return await updateTitle(section, inputs);
        }
        case 'description': {
            return await updateDescription(section, inputs);
        }
        case 'inputs': {
            return await updateInputs(section, inputs);
        }
        case 'outputs': {
            return await updateOutputs(section, inputs);
        }
        case 'contents': {
            return await updateContents(section, inputs);
        }
        default: {
            log.debug(`unknown section found <!-- start ${section} -->. No updates were made.`);
            return {};
        }
    }
}
//# sourceMappingURL=index.js.map