#!/usr/bin/env node
declare module "jest.config" {
    import type { Config } from '@jest/types';
    const config: Config.InitialOptions;
    export default config;
}
declare module "src/logtask/index" {
    export default class LogTask {
        static ingroup_setting: {
            [key: string]: boolean;
        };
        static indentWidth: number;
        static isDebug(): boolean;
        name: string;
        constructor(name: string);
        get ingroup(): boolean;
        set ingroup(value: boolean);
        logStep(emojiStr: string, step: string, description: string, startGroup?: number): Promise<void>;
        debug(description?: string): void;
        start(description?: string): void;
        info(description?: string): void;
        warn(description?: string): void;
        success(description?: string, ingroup?: boolean): void;
        fail(description?: string, ingroup?: boolean): void;
        error(description?: string): void;
        title(description?: string): void;
    }
}
declare module "src/Action" {
    export interface InputType {
        description?: string;
        required?: boolean;
        default?: string;
    }
    export interface OutputType {
        description?: string;
    }
    export interface Runs {
        using: string;
        main: string;
    }
    export interface Branding {
        color: string;
        icon: string;
    }
    export type InputsType = {
        [id: string]: InputType;
    };
    export type OutputsType = {
        [id: string]: OutputType;
    };
    export default class Action {
        name: string;
        description: string;
        branding: Branding;
        inputs: InputsType;
        outputs: OutputsType;
        runs: Runs;
        constructor(actionPath: string);
        inputDefault(inputName: string): string | undefined;
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
    export function wrapDescription(value: string | undefined, content: string[], prefix: string): Promise<string[]>;
}
declare module "src/readme-editor" {
    export const startTokenFormat = "<!-- start %s -->";
    export const endTokenFormat = "<!-- end %s -->";
    export default class ReadmeEditor {
        private readonly filePath;
        private fileContent;
        constructor(filePath: string);
        updateSection(name: string, providedContent: string | string[]): void;
        dumpToFile(): Promise<void>;
    }
}
declare module "src/working-directory" {
    export function workingDirectory(): string;
    export default workingDirectory;
}
declare module "src/inputs" {
    import Action from "src/Action";
    import { Provider } from './nconf/nconf.cjs';
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
        setConfigValueFromActionFileDefault(inputName: string, providedConfigName?: string): void;
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
    import * as feather from 'feather-icons';
    import LogTask from "src/logtask/index";
    type conforms<T, V> = T extends V ? T : V;
    type FeatherIconKeysArray = keyof typeof feather.icons;
    type FeatherIconKeys<T extends string, R = FeatherIconKeysArray> = conforms<T, R>;
    export const GITHUB_ACTIONS_BRANDING_ICONS: Set<string>;
    export const GITHUB_ACTIONS_BRANDING_COLORS: string[];
    export default class SVGEditor {
        log: LogTask;
        window: any;
        canvas: any;
        document: any;
        constructor();
        init(): Promise<void>;
        /**
         * Generates a svg branding image.
         */
        generateSvgImage(svgPath?: string, icon?: FeatherIconKeys<keyof typeof feather.icons>, bgcolor?: string): void;
    }
}
declare module "src/sections/update-branding" {
    import type Inputs from "src/inputs";
    export interface IBranding {
        alt: string;
        img: string;
        url?: string;
    }
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
    export default function updateUsage(token: string, inputs: Inputs): void;
}
declare module "src/sections/index" {
    import type Inputs from "src/inputs";
    export default function updateSection(section: string, inputs: Inputs): void;
}
declare module "src/generate-docs" {
    import Inputs from "src/inputs";
    export const inputs: Inputs;
    export function generateDocs(): void;
}
declare module "src/index" { }
declare module "src/inputs.test" {
    export default function main(): void;
}
