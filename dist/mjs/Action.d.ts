/**
 * This class represents the metadata of a GitHub action defined in the action.yml file.
 * It provides properties and methods for accessing and manipulating the metadata.
 * [Further reading on the metadata can be found here](https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions#inputs)
 */
import { type Branding } from './constants.js';
import LogTask from './logtask/index.js';
/**
 * Represents an input for the action.
 */
export type Input = {
    /** Description of the input */
    description: string;
    /** Whether the input is required */
    required?: boolean;
    /** Default value for the input */
    default?: string;
    /** Optional If the input parameter is used, this string is this.logged as a warning message. You can use this warning to notify users that the input is deprecated and mention any alternatives. */
    deprecationMessage?: string;
};
/**
 * Represents an output for the action.
 */
export interface Output {
    /** Description of the output */
    description?: string;
    value?: string;
}
type CompositeAction = 'composite';
type ContainerAction = 'docker';
type JavascriptAction = `Node${string}` | `node${string}`;
/**
 * Defines the runs property for container actions.
 */
type RunsContainer = {
    'using': ContainerAction;
    'image': string;
    'args'?: string[];
    'pre-entrypoint'?: string;
    'post-entrypoint'?: string;
    'entrypoint'?: string;
};
/**
 * Defines the runs property for JavaScript actions.
 */
type RunsJavascript = {
    /** The runner used to execute the action */
    'using': JavascriptAction;
    /** The entrypoint file for the action */
    'main': string;
    'pre'?: string;
    'pre-if'?: string;
    'post-if'?: string;
    'post'?: string;
};
/**
 * Defines the steps property for composite actions.
 */
type Steps = {
    'shell'?: string;
    'if'?: string;
    'run'?: string;
    'name'?: string;
    'id'?: string;
    'working-directory'?: string;
    'env': {
        [key: string]: string;
    };
};
/**
 * Defines the runs property for composite actions.
 */
type RunsComposite = {
    /** The runner used to execute the action */
    using: CompositeAction;
    steps: Steps;
};
export type ActionType = RunsContainer | RunsJavascript | RunsComposite;
/**
 * Defines how the action is run.
 */
export type ActionYaml = {
    name: string;
    author?: string;
    /** Description of the action */
    description: string;
    /** Branding information */
    branding?: Branding;
    /** Input definitions */
    inputs?: {
        [key: string]: Input;
    };
    /** Output definitions */
    outputs?: {
        [key: string]: Output;
    };
    /** How the action is run */
    runs: ActionType;
    /** Path to the action */
    path: string;
};
/**
 * Parses and represents metadata from action.yml.
 */
export default class Action implements ActionYaml {
    static validate(obj: any): obj is ActionType;
    log: LogTask;
    /** Name of the action */
    name: string;
    author?: string;
    /** Description of the action */
    description: string;
    /** Branding information */
    branding?: Branding;
    /** Input definitions */
    inputs?: {
        [key: string]: Input;
    };
    /** Output definitions */
    outputs?: {
        [key: string]: Output;
    };
    /** How the action is run */
    runs: ActionType;
    /** Path to the action */
    path: string;
    /** the original file content */
    rawYamlString: string;
    /**
     * Creates a new instance of the Action class by loading and parsing action.yml.
     *
     * @param actionPath The path to the action.yml file.
     */
    constructor(actionPath: string);
    loadActionFrom(actionPath: string): ActionYaml;
    /**
    * Gets the value of an input.
    }
  
    /**
     * Gets the default value for an input.
     *
     * @param inputName The name of the input.
     * @returns The default value if defined,or undefined
     */
    inputDefault(inputName: string): string | boolean | undefined;
    /**
     * Stringifies the action back to YAML.
     *
     * @returns The YAML string for debugging.
     */
    stringify(): string;
}
export {};
