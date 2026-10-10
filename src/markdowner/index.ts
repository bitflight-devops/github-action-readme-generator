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
export function padString(text: string, width: number, paddingStart: number): string {
  return ' '.repeat(paddingStart) + text.padEnd(width);
}

/**
 * Escapes special Markdown characters in a string.
 *
 * @param text - The text to escape.
 * @returns The escaped text.
 */
export function markdownEscapeTableCell(text: string): string {
  return text
    .replaceAll('\n', '<br />')
    .replaceAll(/\\+(?=\|)/g, (slashes) => slashes.repeat(2))
    .replaceAll('|', '\\|');
}

/**
 * Escapes inline code blocks in a Markdown string.
 *
 * @param content - Markdown string.
 * @returns String with escaped inline code blocks.
 */
export function markdownEscapeInlineCode(content: string): string {
  return content.replaceAll(/`([^`]*)`/g, '<code>$1</code>').replaceAll('><!--', '>\\<!--');
}
/**
 * Clones a 2D array.
 *
 * @param arr - Array to clone.
 * @returns Cloned array.
 */
export function cloneArray(arr: MarkdownArrayRowType): MarkdownArrayRowType {
  return arr.map((innerArr) => [...innerArr]);
}

/**
 * Gets max and min column counts from 2D array.
 *
 * @param data - 2D string array.
 * @returns Object with max and min cols.
 */
export function getColumnCounts(data: MarkdownArrayRowType): {
  maxCols: number;
  minCols: number;
} {
  let maxCols = 0;
  let minCols = 0;

  for (const e of data) {
    const numCols = e.length;
    maxCols = Math.max(maxCols, numCols);
    minCols = minCols === 0 ? numCols : Math.min(minCols, numCols);
  }

  return { maxCols, minCols };
}

/**
 * Pads 2D array rows to equal length.
 *
 * @param data - 2D array to pad.
 * @param maxCols - Number of columns to pad to.
 * @returns Padded 2D array.
 */
export function padArrayRows(data: MarkdownArrayRowType, maxCols: number): MarkdownArrayRowType {
  return data.map((row) => {
    const padding: string[] = Array.from({ length: Math.max(0, maxCols - row.length) }, () => '');
    return [...row, ...padding];
  });
}

/**
 * Converts a 2D array of strings to a Markdown table.
 *
 * @param data - 2D string array.
 * @returns Markdown table string.
 */
export function ArrayOfArraysToMarkdownTable(providedTableContent: MarkdownArrayRowType): string {
  const clonedData = cloneArray(providedTableContent);
  const { maxCols } = getColumnCounts(clonedData);
  const paddedData = padArrayRows(clonedData, maxCols);
  const renderCells = (cells: string[]): string => `|${cells.join('|')}|\n`;
  const escaped = (value: string): string =>
    markdownEscapeInlineCode(markdownEscapeTableCell(value)).trim();

  const header = paddedData[0] ?? [];
  const lines = [renderCells(header.map((value) => ` **${escaped(value)}** `))];
  lines.push(renderCells(Array.from({ length: maxCols }, () => '---')));
  for (const row of paddedData.slice(1)) {
    lines.push(renderCells(row.map((value) => ` ${escaped(value)} `)));
  }
  return lines.join('');
}

export default ArrayOfArraysToMarkdownTable;
