/**
 * This class represents the metadata of a GitHub action defined in the action.yml file.
 * It provides properties and methods for accessing and manipulating the metadata.
 * [Further reading on the metadata can be found here](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs)
 */
import * as fs from 'node:fs';
import YAML from 'yaml';
import { DEFAULT_BRAND_COLOR, DEFAULT_BRAND_ICON } from './constants.js';
import LogTask from './logtask/index.js';
/**
 * Defines how the action is run.
 */
// type FilterByField<T, K extends keyof T, V> = T extends { [P in K]: V } ? T : never;
/**
 * Parses and represents metadata from action.yml.
 */
export default class Action {
    // Load the action.yml
    /** Name of the action */
    name;
    author;
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
     * Creates a new instance of the Action class by loading and parsing action.yml.
     *
     * @param actionPath The path to the action.yml file.
     */
    constructor(actionPath) {
        // Load and parse action.yml
        const log = new LogTask('action');
        this.path = actionPath;
        try {
            log.debug(`Loading action.yml from ${actionPath}`);
            const actionString = fs.readFileSync(actionPath, 'utf8');
            const actionYaml = YAML.parse(actionString);
            log.success('Loaded configuration successfully');
            this.name = actionYaml.name;
            this.author = actionYaml.author;
            this.description = actionYaml.description;
            this.branding = {
                color: actionYaml.branding?.color ?? DEFAULT_BRAND_COLOR,
                icon: actionYaml.branding?.icon ?? DEFAULT_BRAND_ICON,
            };
            this.inputs = actionYaml.inputs;
            this.outputs = actionYaml.outputs;
            this.runs = actionYaml.runs;
        }
        catch (error) {
            log.fail(`Failed to load ${actionPath}`);
            throw error;
        }
    }
    /**
     * Gets the default value for an input.
     *
     * @param inputName The name of the input.
     * @returns The default value if defined,or undefined
     */
    inputDefault(inputName) {
        return this.inputs[inputName]?.default ?? undefined;
    }
    /**
     * Stringifies the action back to YAML.
     *
     * @returns The YAML string for debugging.
     */
    stringify() {
        try {
            return YAML.stringify(this);
        }
        catch (error) {
            const log = new LogTask('action:stringify');
            log.error(`Failed to stringify action.yml. Error: ${error}`);
            return '';
        }
    }
}
//# sourceMappingURL=Action.js.map