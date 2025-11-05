/// <reference types="node" resolution-mode="require"/>
declare module "vitest.config" {
    const _default: import("vite").UserConfig;
    export default _default;
}
declare module "__tests__/action.constants" {
    export const actTestYmlPath = "./action.test.yml";
    export const actionTestString = "name: Test Action\nauthor: Test Author\ndescription: Test Description\nbranding:\n  color: white\n  icon: activity\ninputs:\n  input1:\n    description: Test Input 1\n    required: true\n    default: default1\n  input2:\n    description: Test Input 2\noutputs:\n  output1:\n    description: Test Output 1\nruns:\n  using: container\n  image: test-image\n  main: test-main\n  pre: test-pre\n";
    export const ghadocsTestString = "{\n  \"owner\": \"user-from-config\",\n  \"repo\": \"repo-from-config\",\n  \"paths\": {\n    \"action\": \"action.test-config.yml\",\n    \"readme\": \"README.test-config.md\"\n  },\n  \"branding_svg_path\": \".github/ghadocs/branding-config.svg\",\n  \"versioning\": {\n    \"enabled\": true,\n    \"prefix\": \"config\",\n    \"override\": \"\",\n    \"branch\": \"config\"\n  }\n}\n";
    export const gitConfigTestString = "[remote \"origin\"]\nurl = https://github.com/ownergit/repogit.git\n";
    export const payloadTestString = "{\n  \"action\": \"opened\",\n  \"repository\": {\n    \"owner\": {\n      \"login\": \"userpayload\"\n    },\n    \"name\": \"testpayload\"\n  },\n  \"issue\": {\n    \"number\": 1\n  },\n  \"sender\": {\n    \"type\": \"User\"\n  }\n}";
}
declare module "__mocks__/node:fs" {
    import type { BigIntStats, PathLike, PathOrFileDescriptor, Stats, StatSyncOptions } from 'node:fs';
    export type { BigIntStats, PathLike, PathOrFileDescriptor, Stats, StatSyncOptions } from 'node:fs';
    export const statSync: import("@vitest/spy").Mock<(path: PathLike, options?: StatSyncOptions | undefined) => Stats | BigIntStats | undefined>;
    export const existsSync: import("@vitest/spy").Mock<(filename: PathLike) => boolean>;
    export const readFileSync: import("@vitest/spy").Mock<(filename: PathOrFileDescriptor) => string | Buffer>;
}
declare module "src/util" {
    export type Nullable<T> = T | null | undefined;
    export function notEmpty(str: Nullable<string>): str is string;
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
declare module "src/constants" {
    /**
     * Represents the Feather icon names.
     */
    import type { FeatherIconNames } from 'feather-icons';
    /**
     * Represents the sections of the README.
     */
    export const README_SECTIONS: readonly ["title", "branding", "description", "usage", "inputs", "outputs", "contents", "badges"];
    /**
     * Represents a single section of the README.
     */
    export type ReadmeSection = (typeof README_SECTIONS)[number];
    /**
     * Represents the file name for the configuration file.
     */
    export const configFileName = ".ghadocs.json";
    /**
     * Enumerates the keys for the configuration options.
     */
    export enum ConfigKeys {
        Owner = "owner",
        Repo = "repo",
        TitlePrefix = "title_prefix",
        Prettier = "prettier",
        Save = "save",
        pathsAction = "paths:action",
        pathsReadme = "paths:readme",
        BrandingSvgPath = "branding_svg_path",
        BrandingAsTitlePrefix = "branding_as_title_prefix",
        VersioningEnabled = "versioning:enabled",
        VersioningOverride = "versioning:override",
        VersioningPrefix = "versioning:prefix",
        VersioningBranch = "versioning:branch",
        IncludeGithubVersionBadge = "versioning:badge",
        DebugNconf = "debug:nconf",
        DebugReadme = "debug:readme",
        DebugConfig = "debug:config",
        DebugAction = "debug:action",
        DebugGithub = "debug:github"
    }
    /**
     * Represents the edge length (in pixels) for the branding square.
     */
    export const brandingSquareEdgeLengthInPixels = 50;
    /**
     * Represents the default brand color.
     */
    export const DEFAULT_BRAND_COLOR = "blue";
    /**
     * Represents the default brand icon.
     */
    export const DEFAULT_BRAND_ICON = "activity";
    /**
     * Represents the markup for center alignment.
     */
    export const ALIGNMENT_MARKUP = "<div align=\"center\">";
    /**
     * Represents the set of icons that are omitted in GitHub Actions branding.
     */
    export const GITHUB_ACTIONS_OMITTED_ICONS: Set<string>;
    /**
     * Represents the set of icons available for GitHub Actions branding.
     */
    export const GITHUB_ACTIONS_BRANDING_ICONS: Set<string>;
    /**
     * Represents the available colors for GitHub Actions branding.
     */
    export const GITHUB_ACTIONS_BRANDING_COLORS: readonly ["white", "yellow", "blue", "green", "orange", "red", "purple", "gray-dark"];
    /**
     * Represents the available brand colors.
     */
    export type BrandColors = (typeof GITHUB_ACTIONS_BRANDING_COLORS)[number];
    /**
     * Checks if the given icon is valid for GitHub Actions branding.
     * @param {Partial<FeatherIconNames>} icon - The icon to validate.
     * @returns A boolean indicating if the icon is valid.
     */
    export function isValidIcon(icon: Partial<FeatherIconNames>): icon is FeatherIconNames;
    /**
     * Checks if the given color is valid for GitHub Actions branding.
     * @param {Partial<BrandColors>} color - The color to validate.
     * @returns A boolean indicating if the color is valid.
     */
    export function isValidColor(color: Partial<BrandColors>): color is BrandColors;
    /**
     * Represents the branding information for the action.
     */
    export interface Branding {
        /** Color for the action branding */
        color: Partial<BrandColors>;
        icon: Partial<FeatherIconNames>;
    }
}
declare module "src/Action" {
    import { type Branding } from "src/constants";
    import LogTask from "src/logtask/index";
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
        constructor(actionPath: string, log?: LogTask);
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
}
declare module "__tests__/action.test" {
    export const __filename: string;
    export const __dirname: string;
}
declare module "__tests__/constants.test" { }
declare module "__tests__/env.test" { }
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
    import LogTask from "src/logtask/index";
    /**
     * The format for the start token of a section.
     */
    export const startTokenFormat = "(^|[^`\\\\])<!--\\s+start\\s+%s\\s+-->";
    /**
     * The format for the end token of a section.
     */
    export const endTokenFormat = "(^|[^`\\\\])<!--\\s+end\\s+%s\\s+-->";
    export default class ReadmeEditor {
        private log;
        /**
         * The path to the README file.
         */
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
        getTokenIndexes(token: string, logTask?: LogTask): number[];
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
declare module "src/inputs" {
    import { Context } from '@actions/github/lib/context.js';
    import nconf from 'nconf';
    import Action, { Input } from "src/Action";
    import { ReadmeSection } from "src/constants";
    import LogTask from "src/logtask/index";
    import ReadmeEditor from "src/readme-editor";
    const Provider: typeof nconf.Provider;
    type IOptions = nconf.IOptions;
    /**
     * Get the filename from the import.meta.url
     */
    export const __filename: string;
    /**
     * Get the directory name from the filename
     */
    export const __dirname: string;
    /**
     * Change working directory to output of workingDirectory()
     */
    export const metaActionPath = "../../action.yml";
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
    export function transformGitHubInputsToArgv(log: LogTask, config: ProviderInstance, obj: KVPairType): undefined | KVPairType;
    /**
     * Sets config value from action file default
     *
     * @param {Action} actionInstance - The action instance
     * @param {string} inputName - The input name
     * @returns {string | boolean | undefined} The default value
     */
    export function setConfigValueFromActionFileDefault(log: LogTask, actionInstance: Action, inputName: string): string | boolean | undefined;
    /**
     * Collects all default values from action file
     *
     * @returns {IOptions} The default values object
     */
    export function collectAllDefaultValuesFromAction(log: LogTask, providedMetaActionPath?: string, providedDefaults?: {
        [key: string]: Input;
    }): IOptions;
    /**
     * Loads the configuration
     *
     * @returns {ProviderInstance} The configuration instance
     */
    export function loadConfig(log: LogTask, providedConfig?: ProviderInstance, configFilePath?: string): ProviderInstance;
    /**
     * Loads the default configuration
     *
     * @param {ProviderInstance} config - The config instance
     * @returns {ProviderInstance} The updated config instance
     */
    export function loadDefaultConfig(log: LogTask, config: ProviderInstance, providedContext?: Context): ProviderInstance;
    /**
     * Loads the required configuration
     *
     * @param {ProviderInstance} config - The config instance
     * @returns {ProviderInstance} The updated config instance
     */
    export function loadRequiredConfig(log: LogTask, config: ProviderInstance, requiredInputs?: readonly string[]): ProviderInstance;
    /**
     *
     */
    export function loadAction(log: LogTask, actionPath: string): Action;
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
}
declare module "src/unicode-word-match" {
    export const unicodeWordMatch: RegExp;
}
declare module "src/helpers" {
    import type { Context } from '@actions/github/lib/context.js';
    import type Inputs from "src/inputs";
    import LogTask from "src/logtask/index";
    import { Nullable } from "src/util";
    export const __filename: string;
    export const __dirname: string;
    /**
     * Returns the input value if it is not empty, otherwise returns undefined.
     * @param value - The input value to check.
     * @returns The input value if it is not empty, otherwise undefined.
     */
    export function undefinedOnEmpty(value: string | undefined): string | undefined;
    /**
     * Returns the basename of the given path.
     * @param pathStr - The path to extract the basename from.
     * @returns The basename of the path.
     */
    export function basename(pathStr: string): string | undefined;
    /**
     * Removes the "refs/heads/" or "refs/tags/" prefix from the given path.
     *
     * @param pathStr - The path to remove the prefix from
     * @returns The path without the prefix, or null if path is empty
     */
    export function stripRefs(pathStr: string): string | null;
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
    export function readFile(filename: string): string;
    export function repoObjFromRepoName(repository: Nullable<string>, log: LogTask, from?: string): Nullable<Repo>;
    export const remoteGitUrlPattern: RegExp;
    /**
     * Finds the repository information from the input, context, environment variables, or git configuration.
     * @param inputRepo - The input repository string.
     * @param context - The GitHub context object.
     * @returns The repository information (owner and repo) or null if not found.
     */
    export function repositoryFinder(inputRepo: Nullable<string>, context: Nullable<Context>): Repo | null;
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
    export function indexOfRegex(str: string, providedRegex: RegExp): number;
    export function lastIndexOfRegex(str: string, providedRegex: RegExp): number;
    export function isObject(value: any): value is object;
}
declare module "__tests__/helpers.test" {
    export const __filename: string;
    export const __dirname: string;
}
declare module "__tests__/inputs.test" {
    export const __filename: string;
    export const __dirname: string;
}
declare module "__tests__/integration-issue-335.test" { }
declare module "src/markdowner/index" {
    /**
     * Types representing a 2D array of strings for a Markdown table.
     */
    export type MarkdownArrayRowType = string[][];
    export type MarkdownArrayItemType = string;
    /**
     * Fills a string to a desired width by padding with spaces.
     *
     * @param text - The text to pad.
     * @param width - The desired total width.
     * @param paddingStart - Number of spaces to pad at the start.
     * @returns The padded string.
     */
    export function padString(text: string, width: number, paddingStart: number): string;
    /**
     * Escapes special Markdown characters in a string.
     *
     * @param text - The text to escape.
     * @returns The escaped text.
     */
    export function markdownEscapeTableCell(text: string): string;
    /**
     * Escapes inline code blocks in a Markdown string.
     *
     * @param content - Markdown string.
     * @returns String with escaped inline code blocks.
     */
    export function markdownEscapeInlineCode(content: string): string;
    /**
     * Clones a 2D array.
     *
     * @param arr - Array to clone.
     * @returns Cloned array.
     */
    export function cloneArray(arr: MarkdownArrayRowType): MarkdownArrayRowType;
    /**
     * Gets max and min column counts from 2D array.
     *
     * @param data - 2D string array.
     * @returns Object with max and min cols.
     */
    export function getColumnCounts(data: MarkdownArrayRowType): {
        maxCols: number;
        minCols: number;
    };
    /**
     * Pads 2D array rows to equal length.
     *
     * @param data - 2D array to pad.
     * @param maxCols - Number of columns to pad to.
     * @returns Padded 2D array.
     */
    export function padArrayRows(data: MarkdownArrayRowType, maxCols: number): MarkdownArrayRowType;
    /**
     * Converts a 2D array of strings to a Markdown table.
     *
     * @param data - 2D string array.
     * @returns Markdown table string.
     */
    export function ArrayOfArraysToMarkdownTable(providedTableContent: MarkdownArrayRowType): string;
    export default ArrayOfArraysToMarkdownTable;
}
declare module "__tests__/markdowner.test" { }
declare module "__tests__/prettier.test" { }
declare module "src/sections/update-badges" {
    /**
     * This TypeScript code imports necessary modules and defines a function named 'updateBadges' which takes a sectionToken (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
     * The function is responsible for updating the badges section in the README.md file based on the provided inputs.
     * It utilizes the 'LogTask' class for logging purposes.
     */
    import { ReadmeSection } from "src/constants";
    import type Inputs from "src/inputs";
    /**
     * Interface for a badge.
     */
    export interface IBadge {
        alt: string;
        img: string;
        url?: string;
    }
    export default function updateBadges(sectionToken: ReadmeSection, inputs: Inputs): Record<string, string>;
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
    import { ReadmeSection } from "src/constants";
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
     * This is a TypeScript function named "updateBranding" that takes in a sectionToken string and an object of inputs.
     * It exports the function as the default export.
     * The function logs the brand details from the inputs, starts a log task, generates image markup,
     * updates a section in the readme editor using the sectionToken and content, and logs success or failure messages.
     *
     * @param sectionToken - The sectionToken string that is used to identify the section in the readme editor.
     * @param inputs - The inputs object that contains data for the function.
     */
    export default function updateBranding(sectionToken: ReadmeSection, inputs: Inputs): Record<string, string>;
}
declare module "src/sections/update-description" {
    /**
     * This TypeScript code exports a function named 'updateDescription' which takes a sectionToken (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
     * The function is responsible for updating the description section in the README.md file based on the provided inputs.
     * It utilizes the 'LogTask' class for logging purposes.
     * @param {ReadmeSection} sectionToken - The sectionToken representing the section of the README to update.
     * @param {Inputs} inputs - The Inputs class instance.
     */
    import { ReadmeSection } from "src/constants";
    import type Inputs from "src/inputs";
    export default function updateDescription(sectionToken: ReadmeSection, inputs: Inputs): Record<string, string>;
}
declare module "src/sections/update-inputs" {
    /**
     * This TypeScript code exports a function named 'updateInputs' which takes a sectionToken (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
     * The function is responsible for updating the inputs section in the README.md file based on the provided inputs.
     * It utilizes the 'LogTask' class for logging purposes, 'columnHeader' and 'rowHeader' functions from '../helpers.js' for formatting table headers, and 'markdowner' function from '../markdowner/index.js' for generating markdown content.
     * @param {ReadmeSection} sectionToken - The sectionToken representing the section of the README to update.
     * @param {Inputs} inputs - The Inputs class instance.
     */
    import { ReadmeSection } from "src/constants";
    import type Inputs from "src/inputs";
    export default function updateInputs(sectionToken: ReadmeSection, inputs: Inputs): Record<string, string>;
}
declare module "src/sections/update-outputs" {
    /**
     * This TypeScript code exports a function named 'updateOutputs' which takes a sectionToken (string) and an instance of the 'Inputs' class as its parameters.
     * The function is responsible for updating the outputs section in the README.md file based on the provided inputs.
     * It generates a table with three columns: Output name, Description, and Value (for composite actions).
     * It utilizes the 'LogTask' class for logging purposes, 'columnHeader' and 'rowHeader' functions from '../helpers.js' for formatting table headers, and 'markdowner' function from '../markdowner/index.js' for generating markdown content.
     * @param {ReadmeSection} sectionToken - The sectionToken used for identifying the section.
     * @param {Inputs} inputs - The Inputs class instance.
     */
    import { ReadmeSection } from "src/constants";
    import type Inputs from "src/inputs";
    export default function updateOutputs(sectionToken: ReadmeSection, inputs: Inputs): Record<string, string>;
}
declare module "src/sections/update-title" {
    /**
     * This TypeScript code exports a function named 'updateTitle' which takes a sectionToken (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
     * The function is responsible for updating the title section in the README.md file based on the provided inputs.
     * It utilizes the 'LogTask' class for logging purposes, the 'generateImgMarkup' function from './update-branding.js' for generating image markup.
     * @param {ReadmeSection} sectionToken - The sectionToken representing the section of the README to update.
     * @param {Inputs} inputs - The Inputs class instance.
     */
    import { ReadmeSection } from "src/constants";
    import type Inputs from "src/inputs";
    export default function updateTitle(sectionToken: ReadmeSection, inputs: Inputs): Record<string, string>;
}
declare module "src/sections/update-usage" {
    import { ReadmeSection } from "src/constants";
    import type Inputs from "src/inputs";
    export default function updateUsage(sectionToken: ReadmeSection, inputs: Inputs): Promise<Record<string, string>>;
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
    import { ReadmeSection } from "src/constants";
    import type Inputs from "src/inputs";
    export default function updateSection(section: ReadmeSection, inputs: Inputs): Promise<Record<string, string>>;
}
declare module "src/readme-generator" {
    import { ReadmeSection } from "src/constants";
    import Inputs from "src/inputs";
    import LogTask from "src/logtask/index";
    export type SectionKV = Record<string, string>;
    /**
     * Class for managing README generation.
     */
    export class ReadmeGenerator {
        /**
         * The Inputs instance.
         */
        private inputs;
        /**
         * The Logger instance.
         */
        private log;
        /**
         * Initializes the ReadmeGenerator.
         *
         * @param inputs - The Inputs instance
         * @param log - The Logger instance
         */
        constructor(inputs: Inputs, log: LogTask);
        /**
         * Updates the README sections.
         *
         * @param sections - The sections array
         * @returns Promise array of section KV objects
         */
        updateSections(sections: ReadmeSection[]): Promise<SectionKV>[];
        /**
         * Resolves the section update promises.
         *
         * @param promises - The promise array
         * @returns Promise resolving to combined sections KV
         */
        resolveUpdates(promises: Promise<SectionKV>[]): Promise<SectionKV>;
        /**
         * Outputs the sections KV to GitHub output.
         *
         * @param sections - The sections KV
         */
        outputSections(sections: SectionKV): void;
        /**
         * Generates the README documentation.
         *
         * @returns Promise resolving when done
         */
        generate(providedSections?: ReadmeSection[]): Promise<void>;
    }
}
declare module "__tests__/readme-generator.test" {
    export const __filename: string;
    export const __dirname: string;
}
declare module "__tests__/logtask/index.test" { }
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
        badge?: string;
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
        prettier?: boolean;
        /**
         * Loads the configuration from the provided `Inputs` object.
         * @param {Inputs} inputs - The `Inputs` object containing the configuration values.
         */
        loadInputs(inputs: Inputs): void;
        /**
         * Saves the configuration to a file. If the file exists, it will be overwritten.
         * @param {string} configPath - The path to the configuration file.
         */
        save(configPath: string): Promise<void>;
    }
}
declare module "src/save" {
    import Inputs from "src/inputs";
    import LogTask from "src/logtask/index";
    /**
     * This script rebuilds the usage section in the README.md to be consistent with the action.yml
     * @param {Inputs} inputs - the inputs class
     */
    export default function save(inputs: Inputs, log: LogTask): void;
}
declare module "src/index" {
    /**
     * Creates a ReadmeGenerator instance and generates docs.
     */
    export function generateReadme(): Promise<void>;
}
declare module "src/working-directory" {
    /**
     * Returns the working directory path based on the environment variables.
     * The order of preference is GITHUB_WORKSPACE, INIT_CWD, and then the current working directory.
     * @returns The working directory path.
     */
    export default function workingDirectory(): string;
}
declare module "src/errors/error-type" {
    export enum ErrorType {
        FILE = "file",
        SCHEMA = "schema",
        VALIDATION = "validation",
        INPUTS = "inputs",
        URL = "url"
    }
}
declare module "src/errors/is-error" {
    /**
     * Type guard to check if an `unknown` value is an `Error` object.
     *
     * @param value - The value to check.
     *
     * @returns `true` if the value is an `Error` object, otherwise `false`.
     */
    export const isError: (value: unknown) => value is Error;
}
