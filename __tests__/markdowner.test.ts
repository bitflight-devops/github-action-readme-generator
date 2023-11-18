import { expect, test } from 'vitest';

import {
  ArrayOfArraysToMarkdownTable,
  cloneArray,
  getColumnCounts,
  markdownEscapeInlineCode,
  markdownEscapeTableCell,
  padArrayRows,
  padString,
} from '../src/markdowner/index.js';

const testArray = [
  ['Header1', 'Header2'],
  ['Cell1', 'Cell2'],
];

test('padString pads text to width with spaces', () => {
  expect(padString('Hi', 5, 0)).toBe('Hi   ');
  expect(padString('Hello', 8, 3)).toBe('   Hello   ');
});

test('markdownEscapeTableCell escapes newlines and pipes', () => {
  expect(markdownEscapeTableCell('Hello\nWorld|Foo')).toBe('Hello<br />World\\|Foo');
});

test('markdownEscapeInlineCode escapes inline code', () => {
  expect(markdownEscapeInlineCode('Hello `World`')).toBe('Hello <code>World</code>');
  expect(markdownEscapeInlineCode('Hello `World`|`Code`')).toBe(
    'Hello <code>World</code>|<code>Code</code>',
  );
});

test('cloneArray clones 2D array', () => {
  const cloned = cloneArray(testArray);
  expect(cloned).toEqual(testArray);
  expect(cloned).not.toBe(testArray);
});

test('getColumnCounts gets max and min columns', () => {
  const { maxCols, minCols } = getColumnCounts(testArray);
  expect(maxCols).toBe(2);
  expect(minCols).toBe(2);
});

test('padArrayRows pads rows to match max cols', () => {
  const padded = padArrayRows(testArray, 4);
  expect(padded[0]).toEqual(['Header1', 'Header2', '', '']);
  expect(padded[1]).toEqual(['Cell1', 'Cell2', '', '']);
});

test('ArrayOfArraysToMarkdownTable converts array to markdown table', () => {
  const expected = `| **Header1** | **Header2** |
|---|---|
| Cell1 | Cell2 |
`;

  expect(ArrayOfArraysToMarkdownTable(testArray)).toBe(expected);
});
