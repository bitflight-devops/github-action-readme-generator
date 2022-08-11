#!/usr/bin/env node
declare module "jest.config" {
    import type { Config } from '@jest/types';
    const config: Config.InitialOptions;
    export default config;
}
declare module "src/logtask/index" {
    class LogTask {
        name: string;
        static ingroup_setting: {
            [key: string]: boolean;
        };
        static indentWidth: number;
        constructor(name: string);
        get ingroup(): boolean;
        set ingroup(value: boolean);
        logStep(emojiStr: string, step: string, description: string): string;
        debug(description?: string): void;
        start(description?: string): void;
        info(description?: string): void;
        warn(description?: string): void;
        success(description?: string, ingroup?: boolean): void;
        fail(description?: string, ingroup?: boolean): void;
        error(description?: string): void;
        title(description?: string): void;
    }
    export default LogTask;
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
    }
}
declare module "src/config" {
    export interface Versioning {
        enabled: boolean;
        prefix: string;
        override: string;
        branch: string;
    }
    export interface Paths {
        action: string;
        readme: string;
    }
    export class GHActionDocsConfig {
        owner: string;
        repo: string;
        title_prefix: string;
        title: string;
        paths: Paths;
        show_logo: boolean;
        versioning: Versioning;
        readmePath: string;
        outpath: string;
        pretty: boolean;
    }
    export const startTokenFormat = "<!-- start %s -->";
    export const endTokenFormat = "<!-- end %s -->";
}
declare module "src/helpers" {
    import type { Context } from '@actions/github/lib/context';
    export function wrapText(text: string | undefined, content: string[], prepend?: string): string[];
    export interface Repo {
        owner: string;
        repo: string;
    }
    export function repositoryFinder(inputRepo: string | undefined | null, context: Context | undefined | null): Repo | null;
}
declare module "src/working-directory" {
    export function workingDirectory(): string;
    export default workingDirectory;
}
declare module "src/inputs" {
    import * as nconf from 'nconf';
    import Action from "src/Action";
    export const configKeys: string[];
    export default class Inputs {
        config: nconf.Provider;
        constructor();
        sections: string[];
        readmePath: string;
        action: Action;
    }
}
declare module "src/save" {
    import Inputs from "src/inputs";
    export default function save(inputs: Inputs): void;
}
declare module "src/readme-writer" {
    export default function readmeWriter(content: string[], tokenName: string, readmePath: string): void;
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
    export default function generateDocs(): void;
}
declare module "src/index" { }
declare module "src/testInputs" {
    export default function main(): void;
}
