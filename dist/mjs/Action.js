/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import * as fs from 'node:fs';
import YAML from 'yaml';
import LogTask from './logtask/index.js';
export default class Action {
    // Load the action.yml
    name;
    description;
    branding;
    inputs;
    outputs;
    runs;
    path;
    constructor(actionPath) {
        const log = new LogTask('action');
        this.path = actionPath;
        let tmpActionYaml = null;
        try {
            log.debug(`loading action.yml from ${actionPath}`);
            const actionString = fs.readFileSync(actionPath, 'utf8');
            tmpActionYaml = YAML.parse(actionString);
            log.success('loaded configuration successfully');
        }
        catch {
            log.error(`failed to load ${actionPath}`);
        }
        if (typeof tmpActionYaml !== 'object' || tmpActionYaml === null) {
            log.error("action.yml file read in isn't an object (no yaml in it)");
        }
        const actionYaml = tmpActionYaml;
        this.name = actionYaml.name;
        this.description = actionYaml.description;
        this.branding = actionYaml.branding;
        this.inputs = actionYaml.inputs;
        this.outputs = actionYaml.outputs;
        this.runs = actionYaml.runs;
    }
    inputDefault(inputName) {
        return this.inputs[inputName]?.default;
    }
    stringify() {
        try {
            return YAML.stringify(this);
        }
        catch {
            const log = new LogTask('action:stringify');
            log.error('failed to stringify action.yml');
            return '';
        }
    }
}
//# sourceMappingURL=Action.js.map