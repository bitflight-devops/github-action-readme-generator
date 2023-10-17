import { GHActionDocsConfig } from './config.js';
// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export default function save(inputs) {
    const docsConfig = new GHActionDocsConfig();
    docsConfig.loadInputs(inputs);
    if (inputs.config.get('save')) {
        docsConfig.save(inputs.configPath);
    }
}
//# sourceMappingURL=save.js.map