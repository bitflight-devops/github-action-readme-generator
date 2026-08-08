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
export declare function padString(text: string, width: number, paddingStart: number): string;
/**
 * Escapes special Markdown characters in a string.
 *
 * @param text - The text to escape.
 * @returns The escaped text.
 */
export declare function markdownEscapeTableCell(text: string): string;
/**
 * Escapes inline code blocks in a Markdown string.
 *
 * @param content - Markdown string.
 * @returns String with escaped inline code blocks.
 */
export declare function markdownEscapeInlineCode(content: string): string;
/**
 * Clones a 2D array.
 *
 * @param arr - Array to clone.
 * @returns Cloned array.
 */
export declare function cloneArray(arr: MarkdownArrayRowType): MarkdownArrayRowType;
/**
 * Gets max and min column counts from 2D array.
 *
 * @param data - 2D string array.
 * @returns Object with max and min cols.
 */
export declare function getColumnCounts(data: MarkdownArrayRowType): {
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
export declare function padArrayRows(data: MarkdownArrayRowType, maxCols: number): MarkdownArrayRowType;
/**
 * Converts a 2D array of strings to a Markdown table.
 *
 * @param data - 2D string array.
 * @returns Markdown table string.
 */
export declare function ArrayOfArraysToMarkdownTable(providedTableContent: MarkdownArrayRowType): string;
export default ArrayOfArraysToMarkdownTable;
