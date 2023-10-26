#!/usr/bin/env node
declare module "jest.config" {
    import type { Config } from '@jest/types';
    const config: Config.InitialOptions;
    export default config;
}
declare module "src/logtask/index" {
    enum LogGroup {
        NO_GROUP = 0,
        START_GROUP = 1,
        END_GROUP = 2,
        IS_ERROR = 3,
        IS_FAILED = 4,
        IS_TITLE = 5
    }
    /**
     * Represents a logging task with various log step methods.
     */
    export default class LogTask {
        /**
         * Map of ingroup settings per task name.
         */
        private static ingroupSettings;
        /**
         * The width of the indentation for log messages.
         */
        private static indentWidth;
        /**
         * Checks if debug mode is enabled.
         * @returns A boolean indicating if debug mode is enabled.
         */
        static isDebug(): boolean;
        /**
         * The name of the task.
         */
        private name;
        /**
         * Creates a new instance of the LogTask class.
         * @param name - The name of the task.
         */
        constructor(name: string);
        /**
         * Gets the ingroup setting for the task.
         */
        get ingroup(): boolean;
        /**
         * Sets the ingroup setting for this task.
         */
        set ingroup(value: boolean);
        getMessageString(step: string, desc: string, emojiStr: string): string;
        /**
         * Logs a step with the given emoji, type, message and group.
         * @param emojiStr - The emoji string to display.
         * @param step - The step type.
         * @param message - The message of the step.
         * @param startGroup - The start group type.
         */
        logStep(emojiStr: string, step: string, message: string, startGroup?: LogGroup): void;
        /**
         * Logs a debug message.
         * @param message - The message of the debug message.
         */
        debug(message?: string): void;
        /**
         * Logs a start message.
         * @param message - The message of the start message.
         */
        start(message?: string): void;
        /**
         * Logs an info message.
         * @param message - The message of the info message.
         */
        info(message?: string): void;
        /**
         * Logs a warning message.
         * @param message - The message of the warning message.
         */
        warn(message?: string): void;
        /**
         * Logs a success message.
         * @param message - The message of the success message.
         * @param ingroup - Indicates whether the success message is in a group.
         */
        success(message?: string, ingroup?: boolean): void;
        /**
         * Logs a failure message.
         * @param message - The message of the failure message.
         * @param ingroup - Indicates whether the failure message is in a group.
         */
        fail(message?: string, ingroup?: boolean): void;
        /**
         * Logs an error message.
         * @param message - The message of the error message.
         */
        error(message?: string): void;
        /**
         * Logs a title message.
         * @param message - The message of the title message.
         */
        title(message?: string): void;
    }
}
declare module "src/Action" {
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
}
declare module "src/helpers" {
    import type { Context } from '@actions/github/lib/context.js';
    import type Inputs from "src/inputs";
    export function undefinedOnEmpty(value: string | undefined): string | undefined;
    export function basename(path: string): string | undefined;
    export function stripRefs(path: string): string | null;
    export function titlecase(text: string): string | undefined;
    export function prefixParser(text: string | undefined): string | undefined;
    export function wrapText(text: string | undefined, content: string[], prepend?: string): string[];
    export interface Repo {
        owner: string;
        repo: string;
    }
    export function repositoryFinder(inputRepo: string | undefined | null, context: Context | undefined | null): Repo | null;
    export function git_default_branch(): string;
    export function columnHeader(value: string): string;
    export function rowHeader(value: string): string;
    export function getCurrentVersionString(inputs: Inputs): string;
}
declare module "src/prettier" {
    export function formatYaml(value: string, filepath?: string): Promise<string>;
    export function formatMarkdown(value: string, filepath?: string): Promise<string>;
    export function wrapDescription(value: string | undefined, content: string[], prefix?: string): Promise<string[]>;
}
declare module "src/readme-editor" {
    export const startTokenFormat = "<!-- start %s -->";
    export const endTokenFormat = "<!-- end %s -->";
    export default class ReadmeEditor {
        private readonly filePath;
        private fileContent;
        constructor(filePath: string);
        getTokenIndexes(token: string): number[];
        updateSection(name: string, providedContent: string | string[], addNewlines?: boolean): void;
        dumpToFile(): Promise<void>;
    }
}
declare module "src/working-directory" {
    export function workingDirectory(): string;
    export default workingDirectory;
}
declare module "src/inputs" {
    import { Provider } from 'nconf';
    import Action from "src/Action";
    import ReadmeEditor from "src/readme-editor";
    export const configFileName = ".ghadocs.json";
    export const configKeys: string[];
    type ProviderInstance = InstanceType<typeof Provider>;
    export default class Inputs {
        config: ProviderInstance;
        sections: string[];
        readmePath: string;
        configPath: string;
        action: Action;
        readmeEditor: ReadmeEditor;
        constructor();
        setConfigValueFromActionFileDefault(actionInstance: Action, inputName: string, providedConfigName?: string): void;
        stringify(): string;
    }
}
declare module "src/config" {
    import type Inputs from "src/inputs";
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
    export class GHActionDocsConfig {
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
        loadInputs(inputs: Inputs): void;
        /**
         *
         * @param configPath {string}
         * @description Saves the config to a file,if the file exists it will be overwritten.
         */
        save(configPath: string): void;
    }
}
declare module "src/constants" {
    export const brandingSquareEdgeLengthInPixels = 50;
    export const DEFAULT_BRAND_COLOR = "blue";
    export const DEFAULT_BRAND_ICON = "activity";
    export const ALIGNMENT_MARKUP = "<div align=\"center\">";
    export const GITHUB_ACTIONS_OMITTED_ICONS: Set<string>;
    export const GITHUB_ACTIONS_BRANDING_ICONS: Set<string>;
    export const GITHUB_ACTIONS_BRANDING_COLORS: string[];
}
declare module "src/save" {
    import Inputs from "src/inputs";
    export default function save(inputs: Inputs): void;
}
declare module "src/sections/update-badges" {
    import type Inputs from "src/inputs";
    export interface IBadge {
        alt: string;
        img: string;
        url?: string;
    }
    export default function updateBadges(token: string, inputs: Inputs): void;
}
declare module "src/svg-editor" {
    import type { Container } from '@svgdotjs/svg.js';
    import type { FeatherIconNames } from 'feather-icons';
    import { SVGDocument, SVGWindow } from 'svgdom';
    import LogTask from "src/logtask/index";
    export default class SVGEditor {
        log: LogTask;
        window?: SVGWindow;
        canvas?: Container;
        document?: SVGDocument;
        constructor();
        init(): Promise<void>;
        /**
         * Generates a svg branding image.
         */
        generateSvgImage(svgPath: string | undefined, icon?: Partial<FeatherIconNames>, bgcolor?: string): void;
    }
}
declare module "src/sections/update-branding" {
    import type { FeatherIconNames } from 'feather-icons';
    import type { Branding } from "src/Action";
    import type Inputs from "src/inputs";
    export interface IBranding {
        alt: string;
        img: string;
        url?: string;
    }
    /**
     * Generates a svg branding image.
     * example:
     * ```ts
     * generateSvgImage('/path/to/file.svg', 'home', 'red')
     * ```
     *
     * @param svgPath - The path to where the svg file will be saved
     * @param icon - The icon name from the feather-icons list
     * @param bgcolor - The background color of the circle behind the icon
     */
    export function generateSvgImage<T extends Partial<FeatherIconNames>>(svgPath: string, icon: T, bgcolor: string): void;
    /**
     * This function returns a valid icon name based on the provided branding.
     * If the branding is undefined or not a valid icon name, an error is thrown.
     * It checks if the branding icon is present in the GITHUB_ACTIONS_BRANDING_ICONS set,
     * and if so, returns the corresponding feather icon key array.
     * If the branding icon is present in the GITHUB_ACTIONS_OMITTED_ICONS set,
     * an error is thrown specifying that the icon is part of the omitted icons list.
     * If the branding icon is not a valid icon from the feather-icons list, an error is thrown.
     * @param brand - The branding object
     * @returns The corresponding feather icon key array
     * @throws Error if the branding icon is undefined, not a valid icon name, or part of the omitted icons list
     */
    export function getValidIconName(brand?: Branding): FeatherIconNames;
    /**
     * This function generates an HTML image markup with branding information.
     * It takes inputs and an optional width parameter.
     * If the branding_svg_path is provided, it generates an action.yml branding image for the specified icon and color.
     * Otherwise, it returns an error message.
     *
     * @param inputs - The inputs instance with data for the function.
     * @param width - The width of the image (default is '15%').
     * @returns The HTML image markup with branding information or an error message.
     */
    export function generateImgMarkup(inputs: Inputs, width?: string): string;
    /**
     * This is a TypeScript function named "updateBranding" that takes in a token string and an object of inputs.
     * It exports the function as the default export.
     * The function logs the brand details from the inputs, starts a log task, generates image markup,
     * updates a section in the readme editor using the token and content, and logs success or failure messages.
     *
     * @param token - The token string that is used to identify the section in the readme editor.
     * @param inputs - The inputs object that contains data for the function.
     */
    export default function updateBranding(token: string, inputs: Inputs): void;
}
declare module "src/sections/update-description" {
    import type Inputs from "src/inputs";
    export default function updateDescription(token: string, inputs: Inputs): void;
}
declare module "src/markdowner/index" {
    export type MarkdownArrayRowType = string[][];
    export type MarkdownArrayItemType = string;
    /**
     * Fills the width of the cell.
     * @param text
     * @param width
     * @param paddingStart
     */
    export function fillWidth(text: string, width: number, paddingStart: number): string;
    /**
     * Escape a text so it can be used in a markdown table
     * @param text
     */
    export function markdownEscapeTableCell(text: string): string;
    export function markdownEscapeInlineCode(content: string): string;
    export function ArrayOfArraysToMarkdownTable(providedTableContent: MarkdownArrayRowType): string;
    export default ArrayOfArraysToMarkdownTable;
}
declare module "src/sections/update-inputs" {
    import type Inputs from "src/inputs";
    export default function updateInputs(token: string, inputs: Inputs): void;
}
declare module "src/sections/update-outputs" {
    import type Inputs from "src/inputs";
    export default function updateOutputs(token: string, inputs: Inputs): void;
}
declare module "src/sections/update-title" {
    import type Inputs from "src/inputs";
    export default function updateTitle(token: string, inputs: Inputs): void;
}
declare module "src/sections/update-usage" {
    import type Inputs from "src/inputs";
    export default function updateUsage(token: string, inputs: Inputs): Promise<void>;
}
declare module "src/sections/index" {
    import type Inputs from "src/inputs";
    export default function updateSection(section: string, inputs: Inputs): Promise<void>;
}
declare module "src/generate-docs" {
    import Inputs from "src/inputs";
    export const inputs: Inputs;
    export function generateDocs(): Promise<void>;
}
declare module "src/index" { }
