import type { Context } from '@actions/github/lib/context.js';
import type Inputs from './inputs.js';
import { Nullable } from './util.js';
export declare const __filename: string;
export declare const __dirname: string;
/**
 * Returns the input value if it is not empty, otherwise returns undefined.
 * @param value - The input value to check.
 * @returns The input value if it is not empty, otherwise undefined.
 */
export declare function undefinedOnEmpty(value: string | undefined): string | undefined;
/**
 * Returns the basename of the given path.
 * @param pathStr - The path to extract the basename from.
 * @returns The basename of the path.
 */
export declare function basename(pathStr: string): string | undefined;
/**
 * Removes the "refs/heads/" or "refs/tags/" prefix from the given path.
 *
 * @param pathStr - The path to remove the prefix from
 * @returns The path without the prefix, or null if path is empty
 */
export declare function stripRefs(pathStr: string): string | null;
/**
 * Converts the given text to title case.
 * @param text - The text to convert.
 * @returns The text converted to title case.
 * @throws {TypeError} If the input is not a string.
 */
export declare function titlecase(text: string): string | undefined;
/**
 * Parses the given text and converts it to title case, replacing underscores and dashes with spaces.
 * @param text - The text to parse and convert.
 * @returns The parsed text converted to title case.
 */
export declare function prefixParser(text: string | undefined): string | undefined;
/**
 * Wraps the given text into multiple lines with a maximum width of 80 characters.
 * @param text - The text to wrap.
 * @param content - The array to store the wrapped lines.
 * @param prepend - The string to prepend to each wrapped line.
 * @returns The array of wrapped lines.
 */
export declare function wrapText(text: string | undefined, content: string[], prepend?: string): string[];
/**
 * Represents a repository with owner and repo properties.
 */
export interface Repo {
    owner: string;
    repo: string;
}
export declare function readFile(filename: string): string;
export declare const remoteGitUrlPattern: RegExp;
/**
 * Finds the repository information from the input, context, environment variables, or git configuration.
 * @param inputRepo - The input repository string.
 * @param context - The GitHub context object.
 * @returns The repository information (owner and repo) or null if not found.
 */
export declare function repositoryFinder(inputRepo: Nullable<string>, context: Nullable<Context>): Repo | null;
/**
 * Returns the default branch of the git repository.
 * @returns The default branch.
 */
/**
 * Gets the default branch for the Git repository.
 *
 * @returns The name of the default branch.
 */
export declare function getDefaultGitBranch(): string;
/**
 * Formats the given value as a column header.
 * @param value - The value to format.
 * @returns The formatted column header.
 */
export declare function columnHeader(value: string): string;
/**
 * Formats the given value as a row header in HTML.
 *
 * Removes formatting from the string and converts it to code style.
 *
 * @param value - The string to format as a header
 * @returns The formatted row header string
 */
export declare function rowHeader(value: string): string;
export declare function getCurrentVersionString(inputs: Inputs): string;
export declare function indexOfRegex(str: string, providedRegex: RegExp): number;
export declare function lastIndexOfRegex(str: string, providedRegex: RegExp): number;
export declare function isObject(value: any): value is object;
