import type Inputs from './inputs.js';
export interface Versioning {
    enabled?: boolean;
    prefix?: string;
    override?: string;
    branch?: string;
}
export interface Paths {
    action: string;
    readme: string;
}
export declare class GHActionDocsConfig {
    owner?: string;
    repo?: string;
    title_prefix?: string;
    title?: string;
    paths?: Paths;
    github_action_branding_svg_path?: string;
    versioning?: Versioning;
    readmePath?: string;
    outpath?: string;
    pretty?: boolean;
    loadInputs(inputs: Inputs): void;
    /**
     *
     * @param configPath {string}
     * @description Saves the config to a file,if the file exists it will be overwritten.
     */
    save(configPath: string): void;
}
