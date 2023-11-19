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
  return text.replaceAll('\n', '<br />').replaceAll('|', '\\|');
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
    const padding = Array.from({ length: maxCols - row.length }).fill('');
    return [...row, ...padding];
  }) as MarkdownArrayRowType;
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
  const maxRows = paddedData.length;

  const markdownArrayRowsLength = maxRows + 1;
  const markdownArrayEntriesLength = maxCols * 2 + 1;
  const markdownArrays: MarkdownArrayRowType = Array.from({ length: markdownArrayRowsLength }, () =>
    Array.from({ length: markdownArrayEntriesLength }, () => '|'),
  );

  const outputStrings: string[] = [];
  let i = 0;
  for (const row of markdownArrays) {
    let col = 0;
    const idx = i > 1 ? i - 1 : 0;
    const dataRow = paddedData[idx];
    for (let j = 0; j < row.length; j++) {
      let content = markdownEscapeTableCell(dataRow[col] ?? '');
      content = markdownEscapeInlineCode(content);
      if (j % 2 === 1) {
        if (i === 0) {
          markdownArrays[i][j] = ` **${content.trim()}** `;
        } else if (i === 1) {
          markdownArrays[i][j] = '---';
        } else {
          markdownArrays[i][j] = ` ${content.trim()} `;
        }
        col += 1;
      }
    }
    outputStrings.push(`${markdownArrays[i].join('')}\n`);
    i += 1;
  }
  return outputStrings.join('');
}

export default ArrayOfArraysToMarkdownTable;
