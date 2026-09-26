/**
 * Finds a section's `<!-- start NAME -->` and `<!-- end NAME -->` markers in a
 * README and pairs them.
 *
 * A marker straight after a backtick or a backslash is quoted or escaped, and
 * is never a marker. The name is matched literally.
 *
 * A section with one start marker and one end marker after it is located
 * wherever the pair sits. Any other shape — a README that documents the
 * markers repeats them — has the markers inside code set aside as examples:
 * inline code, fenced or indented code blocks. Code decides only when the
 * markers are not a single pair: text this tool generated can hold an unclosed
 * fence, and a code check on every lookup would let that fence hide every pair
 * after it.
 *
 * Any other shape is reported rather than guessed at, because a wrong guess
 * replaces text outside the pair, which is the user's.
 */

import * as markdown from 'prettier/plugins/markdown';

/** Where a section's body sits, or why it cannot be located. */
export type SectionSpan =
  | {
      found: true;
      /** Offset just after the start marker. */
      start: number;
      /**
       * Offset of the end marker's `<!--`, or of the line break before it
       * when only spaces or tabs precede the marker on its line. That line
       * break and indentation belong to the marker's line, not to the body.
       */
      end: number;
    }
  | {
      found: false;
      /**
       * - `missing`: no marker for the section, outside code.
       * - `unpaired`: a start marker without an end marker after it, or the
       *   reverse.
       * - `ambiguous`: more than one start marker or more than one end marker
       *   outside code.
       */
      reason: 'missing' | 'unpaired' | 'ambiguous';
      /** The 1-based lines of the markers that were considered. */
      lines: number[];
    };

/** The parts of a Markdown AST node this module reads. */
interface MarkdownNode {
  type: string;
  position?: { start: { offset: number }; end: { offset: number } };
  children?: MarkdownNode[];
}

/**
 * Escapes the regular expression metacharacters in `text`.
 * @param {string} text - Literal text.
 * @returns {string} - A pattern that matches `text` exactly.
 */
function escapeRegExp(text: string): string {
  return text.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');
}

/**
 * The half-open ranges of `source` that Markdown renders as code.
 *
 * Parsed with the markdown parser prettier already bundles, so containers,
 * HTML blocks and indentation follow Markdown's rules rather than a regex.
 * @param {string} source - The document.
 * @returns {Array<[number, number]>} - The code ranges.
 */
function codeRanges(source: string): [number, number][] {
  // The parser drops a leading byte order mark, which shifts its offsets.
  const shift = source.startsWith('﻿') ? 1 : 0;
  const parser = markdown.parsers.markdown;
  const root = parser.parse(source.slice(shift), {} as never) as MarkdownNode;
  const ranges: [number, number][] = [];
  const walk = (node: MarkdownNode): void => {
    if ((node.type === 'code' || node.type === 'inlineCode') && node.position) {
      ranges.push([node.position.start.offset + shift, node.position.end.offset + shift]);
    }
    for (const child of node.children ?? []) {
      walk(child);
    }
  };
  walk(root);
  return ranges;
}

/**
 * The 1-based lines of a set of offsets.
 * @param {string} source - The document.
 * @param {number[]} offsets - Offsets into `source`.
 * @returns {number[]} - The line numbers, in ascending order.
 */
function linesOf(source: string, offsets: number[]): number[] {
  return offsets.map((offset) => source.slice(0, offset).split('\n').length).sort((a, b) => a - b);
}

/**
 * Whether the markers are exactly one start marker and one end marker after it.
 * @param {RegExpExecArray[]} starts - The start markers.
 * @param {RegExpExecArray[]} ends - The end markers.
 * @returns {boolean} - Whether they form a single pair.
 */
function isPair(starts: RegExpExecArray[], ends: RegExpExecArray[]): boolean {
  const [start] = starts;
  const [end] = ends;
  return (
    starts.length === 1 &&
    ends.length === 1 &&
    start !== undefined &&
    end !== undefined &&
    end.index >= start.index + start[0].length
  );
}

/**
 * Locates the body of a section between its markers.
 * @param {string} source - The document.
 * @param {string} name - The section name, matched literally.
 * @returns {SectionSpan} - The body's offsets, or why there is none.
 */
export function locateSection(source: string, name: string): SectionSpan {
  const markers = (kind: 'start' | 'end'): RegExpExecArray[] => [
    ...source.matchAll(
      new RegExp(`(?<![\`\\\\])<!--\\s+${kind}\\s+${escapeRegExp(name)}\\s+-->`, 'g'),
    ),
  ];

  let starts = markers('start');
  let ends = markers('end');
  if (!isPair(starts, ends)) {
    const code = codeRanges(source);
    const live = (match: RegExpExecArray): boolean =>
      !code.some(([from, to]) => match.index >= from && match.index < to);
    starts = starts.filter(live);
    ends = ends.filter(live);
  }
  const lines = (): number[] =>
    linesOf(
      source,
      [...starts, ...ends].map((match) => match.index),
    );

  if (starts.length === 0 && ends.length === 0) {
    return { found: false, reason: 'missing', lines: [] };
  }
  if (starts.length > 1 || ends.length > 1) {
    return { found: false, reason: 'ambiguous', lines: lines() };
  }

  const [start] = starts;
  const [end] = ends;
  const from = start === undefined ? -1 : start.index + start[0].length;
  if (end === undefined || from === -1 || end.index < from) {
    return { found: false, reason: 'unpaired', lines: lines() };
  }

  const indent = source.slice(from, end.index).match(/\n[\t ]*$/);
  return { found: true, start: from, end: indent ? end.index - indent[0].length : end.index };
}
