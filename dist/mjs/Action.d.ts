/**
 * Represents an input for the action.
 */
export interface Input {
    /** Description of the input */
    description?: string;
    /** Whether the input is required */
    required?: boolean;
    /** Default value for the input */
    default?: string;
}
/**
 * Represents an output for the action.
 */
export interface Output {
    /** Description of the output */
    description?: string;
}
/**
 * Defines how the action is run.
 */
interface Runs {
    /** The runner used to execute the action */
    using: string;
    /** The entrypoint file for the action */
    main: string;
}
/**
 * Branding information for the action.
 */
export interface Branding {
    /** Color for the action branding */
    color: string;
    icon: string;
}
/**
 * Parses and represents metadata from action.yml.
 */
export default class Action {
    /** Name of the action */
    name: string;
    /** Description of the action */
    description: string;
    /** Branding information */
    branding: Branding;
    /** Input definitions */
    inputs: {
        [key: string]: Input;
    };
    /** Output definitions */
    outputs: {
        [key: string]: Output;
    };
    /** How the action is run */
    runs: Runs;
    /** Path to the action */
    path: string;
    /**
     * Creates a new Action instance by loading and parsing action.yml.
     *
     * @param actionPath Path to the action
     */
    constructor(actionPath: string);
    /**
     * Gets the default value for an input.
     *
     * @param inputName Name of the input
     * @returns The default value if defined
     */
    inputDefault(inputName: string): string | undefined;
    /**
     * Stringifies the action back to YAML.
     *
     * @returns The YAML string
     */
    stringify(): string;
}
export {};
