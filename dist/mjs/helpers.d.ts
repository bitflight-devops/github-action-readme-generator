import type { Context } from '@actions/github/lib/context.js';
import type Inputs from './inputs.js';
export declare function undefinedOnEmpty(value: string | undefined): string | undefined;
export declare function basename(path: string): string | undefined;
export declare function stripRefs(path: string): string | null;
export declare function titlecase(text: string): string | undefined;
export declare function prefixParser(text: string | undefined): string | undefined;
export declare function wrapText(text: string | undefined, content: string[], prepend?: string): string[];
export interface Repo {
    owner: string;
    repo: string;
}
export declare function repositoryFinder(inputRepo: string | undefined | null, context: Context | undefined | null): Repo | null;
export declare function git_default_branch(): string;
export declare function columnHeader(value: string): string;
export declare function rowHeader(value: string): string;
export declare function getCurrentVersionString(inputs: Inputs): string;
