/**
 * This class represents the metadata of a GitHub action defined in the action.yml file.
 * It provides properties and methods for accessing and manipulating the metadata.
 * [Further reading on the metadata can be found here](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs)
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import YAML from 'yaml';
import { DEFAULT_BRAND_COLOR, DEFAULT_BRAND_ICON } from './constants.js';
import LogTask from './logtask/index.js';
/**
 * Parses and represents metadata from action.yml.
 */
export default class Action {
    log;
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
        this.log = new LogTask(actionPath);
        this.path = actionPath;
        let actionYaml;
        this.log.debug(`Constucting ${actionPath}`);
        try {
            actionYaml = this.loadActionFrom(actionPath);
        }
        catch (error) {
            throw new Error(`Failed to load ${actionPath}. ${error}`);
        }
        this.log.debug(`Action YAML: ${actionYaml}`);
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
    loadActionFrom(actionPath) {
        const actionDir = path.dirname(path.resolve(actionPath));
        this.log.debug(`Load ${actionPath} from ${actionDir}`);
        if (!fs.existsSync(actionPath)) {
            throw new Error(`${actionPath} does not exist in ${actionDir}`);
        }
        if (!fs.statSync(actionPath).isFile()) {
            throw new Error(`${actionPath} is not a file type at ${actionDir}`);
        }
        this.log.debug(`Loaded ${actionPath} from ${actionDir}`);
        const actionString = fs.readFileSync(actionPath, 'utf8');
        return YAML.parse(actionString);
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
            this.log.error(`Failed to stringify Action. ${error}`);
            // this is just for debugging, continue on error
            return '';
        }
    }
}
//# sourceMappingURL=Action.js.map