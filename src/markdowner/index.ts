export type MarkdownArrayRowType = string[][];
export type MarkdownArrayItemType = string;
export function ArrayOfArraysToMarkdownTable(providedTableContent: MarkdownArrayRowType): string {
  const tableContent: MarkdownArrayRowType = [];
  const outputStrings = [];
  // Clone the arrays so we don't modify the original
  for (const rowA of providedTableContent) {
    tableContent.push([...rowA] as string[]);
  }
  const maxRows = tableContent.length;
  let maxCols = 0;
  let minCols = 0;
  // Find the max and min columns so we can pad the rows
  for (const [i, e] of tableContent.entries()) {
    if (tableContent[i] !== undefined) {
      const numCols = e.length;
      if (numCols > maxCols) {
        maxCols = numCols;
      }
      if (numCols < minCols || minCols === 0) {
        minCols = numCols;
      }
    }
  }
  if (maxCols !== minCols) {
    for (const [i, e] of tableContent.entries()) {
      if (typeof tableContent[i] === 'undefined') {
        tableContent[i] = Array.from({ length: maxCols }).fill('') as string[];
      } else if (e.length < maxCols) {
        tableContent[i] = [
          ...e,
          ...Array.from({ length: maxCols - e.length }).fill('undefined'),
        ] as string[];
      }
    }
  }
  const markdownArrayRowsLength = maxRows + 1;
  const markdownArrayEntriesLength = maxCols * 2 + 1;
  const markdownArrays: MarkdownArrayRowType = Array.from({ length: markdownArrayRowsLength }).fill(
    Array.from({ length: markdownArrayEntriesLength }).fill('|' as string) as string[],
  ) as MarkdownArrayRowType;
  for (const [i, row] of markdownArrays.entries()) {
    let col = 0;

    const idx = i > 1 ? i - 1 : 0;
    const dataRow = tableContent[idx] as string[];
    for (const [j] of row.entries()) {
      let content = dataRow[col]?.replace(/\n/, '<br />') ?? '';
      if (content.includes('|')) {
        content = content.replace(/\|/g, '&#124;');
        content = content.replace(/`/g, '');
      }

      if (j % 2 === 1) {
        if (i === 0) {
          (markdownArrays[i] as string[])[j] = ` **${content}** `;
        } else if (i === 1) {
          (markdownArrays[i] as string[])[j] = '---';
        } else {
          (markdownArrays[i] as string[])[j] = ` ${content} `;
        }
        col += 1;
      }
    }
    outputStrings.push(`${(markdownArrays[i] as string[]).join('')}\n`);
  }

  return outputStrings.join('');
}

export default ArrayOfArraysToMarkdownTable;
