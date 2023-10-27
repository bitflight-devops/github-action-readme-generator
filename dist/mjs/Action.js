/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import * as fs from 'node:fs';
import YAML from 'yaml';
import { DEFAULT_BRAND_COLOR, DEFAULT_BRAND_ICON } from './constants.js';
import LogTask from './logtask/index.js';
/**
 * Parses and represents metadata from action.yml.
 */
export default class Action {
    // Load the action.yml
    /** Name of the action */
    name;
    /** Description of the action */
    description;
    /** Branding information */
    branding;
    /** Input definitions */
    inputs;
    /** Output definitions */
    outputs;
    /** How the action is run */
    runs;
    /** Path to the action */
    path;
    /**
     * Creates a new Action instance by loading and parsing action.yml.
     *
     * @param actionPath Path to the action
     */
    constructor(actionPath) {
        // Load and parse action.yml
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
        this.branding = {
            color: actionYaml.branding?.color ?? DEFAULT_BRAND_COLOR,
            icon: actionYaml.branding?.icon ?? DEFAULT_BRAND_ICON,
        };
        this.inputs = actionYaml.inputs;
        this.outputs = actionYaml.outputs;
        this.runs = actionYaml.runs;
    }
    /**
     * Gets the default value for an input.
     *
     * @param inputName Name of the input
     * @returns The default value if defined
     */
    inputDefault(inputName) {
        return this.inputs[inputName]?.default;
    }
    /**
     * Stringifies the action back to YAML.
     *
     * @returns The YAML string
     */
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