import { Context } from '@actions/github/lib/context.js';
import nconf from 'nconf';
import Action, { Input } from './Action.js';
import { ReadmeSection } from './constants.js';
import LogTask from './logtask/index.js';
import ReadmeEditor from './readme-editor.js';
declare const Provider: typeof nconf.Provider;
type IOptions = nconf.IOptions;
/**
 * Get the filename from the import.meta.url
 */
export declare const __filename: string;
/**
 * Get the directory name from the filename
 */
export declare const __dirname: string;
/**
 * Change working directory to output of workingDirectory()
 */
export declare const metaActionPath = "../../action.yml";
export type ArgvOptionProperties = {
    [key: string]: {
        alias: string | string[];
        describe: string;
        parseValues?: boolean;
        type?: string;
    };
};
/**
 * Interface for key/value pair object
 */
type KVPairType = {
    key: string;
    value: string | undefined;
};
/**
 * Type alias for Provider instance
 */
type ProviderInstance = InstanceType<typeof Provider>;
export declare function transformGitHubInputsToArgv(log: LogTask, config: ProviderInstance, obj: KVPairType): undefined | KVPairType;
/**
 * Sets config value from action file default
 *
 * @param {Action} actionInstance - The action instance
 * @param {string} inputName - The input name
 * @returns {string | boolean | undefined} The default value
 */
export declare function setConfigValueFromActionFileDefault(log: LogTask, actionInstance: Action, inputName: string): string | boolean | undefined;
/**
 * Collects all default values from action file
 *
 * @returns {IOptions} The default values object
 */
export declare function collectAllDefaultValuesFromAction(log: LogTask, providedMetaActionPath?: string, providedDefaults?: {
    [key: string]: Input;
}): IOptions;
/**
 * Loads the configuration
 *
 * @returns {ProviderInstance} The configuration instance
 */
export declare function loadConfig(log: LogTask, providedConfig?: ProviderInstance, configFilePath?: string): ProviderInstance;
/**
 * Loads the default configuration
 *
 * @param {ProviderInstance} config - The config instance
 * @returns {ProviderInstance} The updated config instance
 */
export declare function loadDefaultConfig(log: LogTask, config: ProviderInstance, providedContext?: Context): ProviderInstance;
/**
 * Loads the required configuration
 *
 * @param {ProviderInstance} config - The config instance
 * @returns {ProviderInstance} The updated config instance
 */
export declare function loadRequiredConfig(log: LogTask, config: ProviderInstance, requiredInputs?: readonly string[]): ProviderInstance;
/**
 *
 */
export declare function loadAction(log: LogTask, actionPath: string): Action;
export type InputContext = {
    /**
     * The configuration instance
     */
    config?: ProviderInstance;
    /**
     * The readme sections
     */
    sections?: ReadmeSection[];
    /**
     * The readme file path
     */
    readmePath?: string;
    /**
     * The config file path
     */
    configPath?: string;
    /**
     * The action instance
     */
    action?: Action;
    /**
     * The readme editor instance
     */
    readmeEditor?: ReadmeEditor;
    /**
     * The repository owner
     */
    owner?: string;
    /**
     * The repository name
     */
    repo?: string;
};
/**
 * Main Inputs class that handles configuration
 */
export default class Inputs {
    /**
     * The configuration instance
     */
    config: ProviderInstance;
    /**
     * The readme sections
     */
    sections: ReadmeSection[];
    /**
     * The readme file path
     */
    readmePath: string;
    /**
     * The config file path
     */
    configPath: string;
    /**
     * The action instance
     */
    action: Action;
    /**
     * The readme editor instance
     */
    readmeEditor: ReadmeEditor;
    /**
     * The repository owner
     */
    owner: string;
    /**
     * The repository name
     */
    repo: string;
    /** The logger for this instance */
    log: LogTask;
    /**
     * Initializes a new instance of the Inputs class.
     */
    constructor(providedInputContext?: InputContext, log?: LogTask);
    stringify(): string;
}
export {};
