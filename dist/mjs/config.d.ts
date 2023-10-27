/**
 * This TypeScript code imports the necessary modules and defines two interfaces: `Versioning` and `Paths`.
 * It also defines a class named `GHActionDocsConfig` that represents the configuration for generating GitHub Actions documentation.
 * The class has properties that correspond to the configuration options and a method `loadInputs` to load the configuration from the provided `Inputs` object.
 * The class also has a method `save` to save the configuration to a file.
 */
import type Inputs from './inputs.js';
/**
 * Represents the versioning configuration for GitHub Actions documentation.
 */
export interface Versioning {
    enabled?: boolean;
    prefix?: string;
    override?: string;
    branch?: string;
}
/**
 * Represents the paths configuration for GitHub Actions documentation.
 */
export interface Paths {
    action: string;
    readme: string;
}
/**
 * Represents the configuration for generating GitHub Actions documentation.
 */
export declare class GHActionDocsConfig {
    owner?: string;
    repo?: string;
    title_prefix?: string;
    title?: string;
    paths?: Paths;
    branding_svg_path?: string;
    versioning?: Versioning;
    readmePath?: string;
    outpath?: string;
    pretty?: boolean;
    /**
     * Loads the configuration from the provided `Inputs` object.
     * @param {Inputs} inputs - The `Inputs` object containing the configuration values.
     */
    loadInputs(inputs: Inputs): void;
    /**
     * Saves the configuration to a file. If the file exists, it will be overwritten.
     * @param {string} configPath - The path to the configuration file.
     */
    save(configPath: string): void;
}
