import LogTask from '../logtask/index.js';
import updateBadges from './update-badges.js';
import updateBranding from './update-branding.js';
import updateDescription from './update-description.js';
import updateInputs from './update-inputs.js';
import updateOutputs from './update-outputs.js';
import updateTitle from './update-title.js';
import updateUsage from './update-usage.js';
const log = new LogTask('updateSection');
export default async function updateSection(section, inputs) {
    const [startToken, stopToken] = inputs.readmeEditor.getTokenIndexes(section);
    if ((startToken === -1 || stopToken === -1) &&
        ['branding', 'title'].includes(section) &&
        inputs.config.get('branding_as_title_prefix') !== true) {
        return;
    }
    switch (section) {
        case 'branding': {
            return updateBranding(section, inputs);
        }
        case 'badges': {
            return updateBadges(section, inputs);
        }
        case 'usage': {
            return updateUsage(section, inputs);
        }
        case 'title': {
            return updateTitle(section, inputs);
        }
        case 'description': {
            return updateDescription(section, inputs);
        }
        case 'inputs': {
            return updateInputs(section, inputs);
        }
        case 'outputs': {
            return updateOutputs(section, inputs);
        }
        default: {
            return log.debug(`unknown section ${section}`);
        }
    }
}
//# sourceMappingURL=index.js.map