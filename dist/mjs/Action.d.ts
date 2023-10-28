import { type Branding } from './constants.js';
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
    /** Optional If the input parameter is used, this string is logged as a warning message. You can use this warning to notify users that the input is deprecated and mention any alternatives. */
    deprecationMessage?: string;
}
/**
 * Represents an output for the action.
 */
export interface Output {
    /** Description of the output */
    description?: string;
    value?: string;
}
type CompositeAction = 'composite';
type ContainerAction = 'container';
type JavascriptAction = `Node${string}` | `node${string}`;
/**
 * Defines how the action is run.
 */
interface RunsContainer {
    using: ContainerAction;
    image: string;
    main: string;
    pre: string;
}
interface RunsJavascript {
    /** The runner used to execute the action */
    'using': JavascriptAction;
    /** The entrypoint file for the action */
    'main': string;
    'pre'?: string;
    'pre-if'?: string;
    'post-if'?: string;
    'post'?: string;
}
interface Steps {
    'shell'?: string;
    'if'?: string;
    'run'?: string;
    'name'?: string;
    'id'?: string;
    'working-directory'?: string;
    'env': {
        [key: string]: string;
    };
}
interface RunsComposite {
    /** The runner used to execute the action */
    using: CompositeAction;
    steps?: Steps;
}
export type ActionType = RunsContainer | RunsJavascript | RunsComposite;
/**
 * Defines how the action is run.
 */
/**
 * Parses and represents metadata from action.yml.
 */
export default class Action {
    /** Name of the action */
    name: string;
    author: string;
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
    runs: ActionType;
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
    inputDefault(inputName: string): string | boolean | undefined;
    /**
     * Stringifies the action back to YAML.
     *
     * @returns The YAML string
     */
    stringify(): string;
}
export {};
