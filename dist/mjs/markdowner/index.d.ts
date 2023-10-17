export type MarkdownArrayRowType = string[][];
export type MarkdownArrayItemType = string;
/**
 * Fills the width of the cell.
 * @param text
 * @param width
 * @param paddingStart
 */
export declare function fillWidth(text: string, width: number, paddingStart: number): string;
/**
 * Escape a text so it can be used in a markdown table
 * @param text
 */
export declare function markdownEscapeTableCell(text: string): string;
export declare function markdownEscapeInlineCode(content: string): string;
export declare function ArrayOfArraysToMarkdownTable(providedTableContent: MarkdownArrayRowType): string;
export default ArrayOfArraysToMarkdownTable;
