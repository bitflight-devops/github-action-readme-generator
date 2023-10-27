#!/usr/bin/env node
declare module "jest.config" {
    import type { Config } from '@jest/types';
    const config: Config.InitialOptions;
    export default config;
}
declare module "src/constants" {
    import type { FeatherIconNames } from 'feather-icons';
    export const brandingSquareEdgeLengthInPixels = 50;
    export const DEFAULT_BRAND_COLOR = "blue";
    export const DEFAULT_BRAND_ICON = "activity";
    export const ALIGNMENT_MARKUP = "<div align=\"center\">";
    export const GITHUB_ACTIONS_OMITTED_ICONS: Set<string>;
    export const GITHUB_ACTIONS_BRANDING_ICONS: Set<string>;
    export const GITHUB_ACTIONS_BRANDING_COLORS: readonly ["white", "yellow", "blue", "green", "orange", "red", "purple", "gray-dark"];
    export type BrandColors = (typeof GITHUB_ACTIONS_BRANDING_COLORS)[number];
    export function isValidIcon(icon: Partial<FeatherIconNames>): icon is FeatherIconNames;
    export function isValidColor(color: Partial<BrandColors>): color is BrandColors;
    /**
     * Branding information for the action.
     */
    export interface Branding {
        /** Color for the action branding */
        color: Partial<BrandColors>;
        icon: Partial<FeatherIconNames>;
    }
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
    import { type Branding } from "src/constants";
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
declare module "src/unicode-word-match" {
    export const unicodeWordMatch: RegExp;
}
declare module "src/helpers" {
    import type { Context } from '@actions/github/lib/context.js';
    import type Inputs from "src/inputs";
    /**
     * Returns the input value if it is not empty, otherwise returns undefined.
     * @param value - The input value to check.
     * @returns The input value if it is not empty, otherwise undefined.
     */
    export function undefinedOnEmpty(value: string | undefined): string | undefined;
    /**
     * Returns the basename of the given path.
     * @param path - The path to extract the basename from.
     * @returns The basename of the path.
     */
    export function basename(path: string): string | undefined;
    /**
     * Removes the "refs/heads/" or "refs/tags/" prefix from the given path.
     *
     * @param path - The path to remove the prefix from
     * @returns The path without the prefix, or null if path is empty
     */
    export function stripRefs(path: string): string | null;
    /**
     * Converts the given text to title case.
     * @param text - The text to convert.
     * @returns The text converted to title case.
     * @throws {TypeError} If the input is not a string.
     */
    export function titlecase(text: string): string | undefined;
    /**
     * Parses the given text and converts it to title case, replacing underscores and dashes with spaces.
     * @param text - The text to parse and convert.
     * @returns The parsed text converted to title case.
     */
    export function prefixParser(text: string | undefined): string | undefined;
    /**
     * Wraps the given text into multiple lines with a maximum width of 80 characters.
     * @param text - The text to wrap.
     * @param content - The array to store the wrapped lines.
     * @param prepend - The string to prepend to each wrapped line.
     * @returns The array of wrapped lines.
     */
    export function wrapText(text: string | undefined, content: string[], prepend?: string): string[];
    /**
     * Represents a repository with owner and repo properties.
     */
    export interface Repo {
        owner: string;
        repo: string;
    }
    /**
     * Finds the repository information from the input, context, environment variables, or git configuration.
     * @param inputRepo - The input repository string.
     * @param context - The GitHub context object.
     * @returns The repository information (owner and repo) or null if not found.
     */
    export function repositoryFinder(inputRepo: string | undefined | null, context: Context | undefined | null): Repo | null;
    /**
     * Returns the default branch of the git repository.
     * @returns The default branch.
     */
    /**
     * Gets the default branch for the Git repository.
     *
     * @returns The name of the default branch.
     */
    export function getDefaultGitBranch(): string;
    /**
     * Formats the given value as a column header.
     * @param value - The value to format.
     * @returns The formatted column header.
     */
    export function columnHeader(value: string): string;
    /**
     * Formats the given value as a row header in HTML.
     *
     * Removes formatting from the string and converts it to code style.
     *
     * @param value - The string to format as a header
     * @returns The formatted row header string
     */
    export function rowHeader(value: string): string;
    export function getCurrentVersionString(inputs: Inputs): string;
}
declare module "src/prettier" {
    /**
     * Formats a YAML string using `prettier`.
     * @param {string} value - The YAML string to format.
     * @param {string} [filepath] - The optional filepath.
     * @returns {Promise<string>} A promise that resolves with the formatted YAML string.
     */
    export function formatYaml(value: string, filepath?: string): Promise<string>;
    /**
     * Formats a Markdown string using `prettier`.
     * @param {string} value - The Markdown string to format.
     * @param {string} [filepath] - The optional filepath.
     * @returns {Promise<string>} A promise that resolves with the formatted Markdown string.
     */
    export function formatMarkdown(value: string, filepath?: string): Promise<string>;
    /**
     * Wraps a description text with a prefix and formats it using `prettier`.
     * @param {string | undefined} value - The description text to wrap and format.
     * @param {string[]} content - The array of content to update.
     * @param {string} [prefix='    # '] - The optional prefix to wrap the description lines.
     * @returns {Promise<string[]>} A promise that resolves with the updated content array.
     */
    export function wrapDescription(value: string | undefined, content: string[], prefix?: string): Promise<string[]>;
}
declare module "src/readme-editor" {
    /**
     * The format for the start token of a section.
     */
    export const startTokenFormat = "<!-- start %s -->";
    /**
     * The format for the end token of a section.
     */
    export const endTokenFormat = "<!-- end %s -->";
    export default class ReadmeEditor {
        private readonly filePath;
        private fileContent;
        /**
         * Creates a new instance of `ReadmeEditor`.
         * @param {string} filePath - The path to the README file.
         */
        constructor(filePath: string);
        /**
         * Gets the indexes of the start and end tokens for a given section.
         * @param {string} token - The section token.
         * @returns {number[]} - The indexes of the start and end tokens.
         */
        getTokenIndexes(token: string): number[];
        /**
         * Updates a specific section in the README file with the provided content.
         * @param {string} name - The name of the section.
         * @param {string | string[]} providedContent - The content to update the section with.
         * @param {boolean} addNewlines - Whether to add newlines before and after the content.
         */
        updateSection(name: string, providedContent: string | string[], addNewlines?: boolean): void;
        /**
         * Dumps the modified content back to the README file.
         * @returns {Promise<void>}
         */
        dumpToFile(): Promise<void>;
    }
}
declare module "src/sections/update-badges" {
    import type Inputs from "src/inputs";
    import type { ReadmeSection } from "src/sections/index";
    /**
     * Interface for a badge.
     */
    export interface IBadge {
        alt: string;
        img: string;
        url?: string;
    }
    export default function updateBadges(token: ReadmeSection, inputs: Inputs): void;
}
declare module "src/svg-editor" {
    import type { FeatherIconNames } from 'feather-icons';
    import type { BrandColors } from "src/constants";
    /**
     * Utility class for generating SVG images.
     */
    export default class SVGEditor {
        private log;
        private window?;
        private canvas?;
        private document?;
        /**
         * Initializes a new SVGEditor instance.
         */
        constructor();
        /**
         * Initializes the SVG window, document, and canvas if not already set up.
         */
        initSVG(): Promise<void>;
        /**
         * Generates a branded SVG image.
         * @param {string | undefined} svgPath - Path to write the generated SVG file to.
         * @param {Partial<FeatherIconNames>} icon - Name of the icon to use.
         * @param {Partial<BrandColors>} bgcolor - Background color for the image.
         * @returns {Promise<void>} A promise that resolves when the image is generated.
         */
        generateSvgImage(svgPath: string | undefined, icon?: Partial<FeatherIconNames>, bgcolor?: Partial<BrandColors>): Promise<void>;
        /**
         * Writes the SVG xml to disk.
         * @param {string} svgPath - File path to save the SVG to.
         * @param {string} svgContent - The XML for the SVG file.
         */
        writeSVGFile(svgPath: string, svgContent: string): void;
        /**
         * Generates the SVG content for the branding image.
         * @param {FeatherIconNames} icon - Name of the icon to use.
         * @param {BrandColors} color - Background color for the image.
         * @param {number} outerViewBox - Size of the canvas for the image.
         * @returns {string} The generated SVG content.
         */
        generateSVGContent(icon: FeatherIconNames, color: BrandColors, outerViewBox?: number): string;
    }
}
declare module "src/sections/update-branding" {
    import type { FeatherIconNames } from 'feather-icons';
    import type { BrandColors } from "src/constants";
    import type Inputs from "src/inputs";
    import type { ReadmeSection } from "src/sections/index";
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
    export function generateSvgImage(svgPath: string, icon: Partial<FeatherIconNames>, bgcolor: Partial<BrandColors>): void;
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
    export function getValidIconName(icon?: Partial<FeatherIconNames>): FeatherIconNames;
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
    export default function updateBranding(token: ReadmeSection, inputs: Inputs): void;
}
declare module "src/sections/update-description" {
    /**
     * This TypeScript code exports a function named 'updateDescription' which takes a token (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
     * The function is responsible for updating the description section in the README.md file based on the provided inputs.
     * It utilizes the 'LogTask' class for logging purposes.
     * @param {ReadmeSection} token - The token representing the section of the README to update.
     * @param {Inputs} inputs - The Inputs class instance.
     */
    import type Inputs from "src/inputs";
    import type { ReadmeSection } from "src/sections/index";
    export default function updateDescription(token: ReadmeSection, inputs: Inputs): void;
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
    import type { ReadmeSection } from "src/sections/index";
    export default function updateInputs(token: ReadmeSection, inputs: Inputs): void;
}
declare module "src/sections/update-outputs" {
    import type Inputs from "src/inputs";
    import type { ReadmeSection } from "src/sections/index";
    export default function updateOutputs(token: ReadmeSection, inputs: Inputs): void;
}
declare module "src/sections/update-title" {
    /**
     * This TypeScript code exports a function named 'updateTitle' which takes a token (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
     * The function is responsible for updating the title section in the README.md file based on the provided inputs.
     * It utilizes the 'LogTask' class for logging purposes, the 'generateImgMarkup' function from './update-branding.js' for generating image markup.
     * @param {ReadmeSection} token - The token representing the section of the README to update.
     * @param {Inputs} inputs - The Inputs class instance.
     */
    import type Inputs from "src/inputs";
    import type { ReadmeSection } from "src/sections/index";
    export default function updateTitle(token: ReadmeSection, inputs: Inputs): void;
}
declare module "src/sections/update-usage" {
    import type Inputs from "src/inputs";
    import type { ReadmeSection } from "src/sections/index";
    export default function updateUsage(token: ReadmeSection, inputs: Inputs): Promise<void>;
}
declare module "src/sections/index" {
    /**
     * This TypeScript code exports a function named 'updateSection' which takes a section (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
     * The function is responsible for updating different sections of the README.md file based on the provided section input.
     * It utilizes various update functions (e.g., updateBranding, updateBadges) to update specific sections.
     * @param {ReadmeSection} section - The section of the README to update.
     * @param {Inputs} inputs - The Inputs class instance.
     * @returns {Promise<void>} A promise that resolves once the section is updated.
     */
    import type Inputs from "src/inputs";
    export const README_SECTIONS: readonly ["title", "branding", "description", "usage", "inputs", "outputs", "contents", "badges"];
    export type ReadmeSection = (typeof README_SECTIONS)[number];
    export default function updateSection(section: ReadmeSection, inputs: Inputs): Promise<void>;
}
declare module "src/working-directory" {
    /**
     * Returns the working directory path based on the environment variables.
     * The order of preference is GITHUB_WORKSPACE, INIT_CWD, and then the current working directory.
     * @returns The working directory path.
     */
    export default function workingDirectory(): string;
}
declare module "src/inputs" {
    import { Provider } from 'nconf';
    import Action from "src/Action";
    import ReadmeEditor from "src/readme-editor";
    import { ReadmeSection } from "src/sections/index";
    export const configFileName = ".ghadocs.json";
    type ProviderInstance = InstanceType<typeof Provider>;
    export default class Inputs {
        config: ProviderInstance;
        sections: ReadmeSection[];
        readmePath: string;
        configPath: string;
        action: Action;
        readmeEditor: ReadmeEditor;
        /**
         * Initializes a new instance of the Inputs class.
         */
        constructor();
        setConfigValueFromActionFileDefault(actionInstance: Action, inputName: string, providedConfigName?: string): void;
        stringify(): string;
    }
}
declare module "src/config" {
    import type Inputs from "src/inputs";
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
}
declare module "src/save" {
    import Inputs from "src/inputs";
    /**
     * This script rebuilds the usage section in the README.md to be consistent with the action.yml
     * @param {Inputs} inputs - the inputs class
     */
    export default function save(inputs: Inputs): void;
}
declare module "src/generate-docs" {
    /**
     * This TypeScript code imports various modules and defines a function named 'generateDocs'.
     * The function is responsible for generating documentation for the README.md file based on the provided inputs.
     * It iterates through each section defined in the 'inputs.sections' array and calls the 'updateSection' function to update the corresponding section in the README.md file.
     * If an error occurs during the update of a section, it logs the error message and stops the process.
     * Finally, it saves the updated README.md file and calls the 'save' function.
     */
    import Inputs from "src/inputs";
    export const inputs: Inputs;
    /**
     * Generates documentation for the README.md file.
     * @returns {Promise<void>} A promise that resolves once the documentation is generated.
     */
    export function generateDocs(): Promise<void>;
}
declare module "src/index" { }
