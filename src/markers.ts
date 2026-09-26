/**
 * Finds a section's `<!-- start NAME -->` and `<!-- end NAME -->` markers in a
 * README and pairs them.
 *
 * Some text looks like a marker and is not one:
 *
 * - a marker straight after a backtick or a backslash, which is quoted inline
 *   or escaped;
 * - a marker inside a fenced code block, which renders as code — the usual
 *   shape of a README that documents the markers.
 *
 * A section is located only when it has exactly one start marker and one end
 * marker after it. Any other shape is reported rather than guessed at, because
 * a wrong guess replaces text outside the pair, which is the user's.
 */

/** Where a section's body sits, or why it cannot be located. */
export type SectionSpan =
  | {
      found: true;
      /** Offset just after the start marker. */
      start: number;
      /**
       * Offset of the end marker's `<!--`, or of the line break before it
       * when the end marker starts its line. That line break belongs to the
       * marker's line, not to the body.
       */
      end: number;
    }
  | {
      found: false;
      /**
       * - `missing`: no marker for the section.
       * - `unpaired`: a start marker without an end marker after it, or the
       *   reverse.
       * - `ambiguous`: more than one start marker or more than one end marker.
       */
      reason: 'missing' | 'unpaired' | 'ambiguous';
      /** The 1-based lines of every marker found for the section. */
      lines: number[];
    };

/**
 * A fence opener or closer: three or more backticks or tildes, after optional
 * indentation and blockquote prefixes.
 */
const FENCE = /^(?:[\t ]*>)*[\t ]*(`{3,}|~{3,})(.*)$/;

/**
 * Escapes the regular expression metacharacters in `text`.
 * @param {string} text - Literal text.
 * @returns {string} - A pattern that matches `text` exactly.
 */
function escapeRegExp(text: string): string {
  return text.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');
}

/**
 * The half-open ranges of `source` inside fenced code blocks, fence lines
 * included. An unclosed fence runs to the end of the document, as it renders.
 * @param {string} source - The document.
 * @returns {Array<[number, number]>} - The fenced ranges, in document order.
 */
function fencedRanges(source: string): [number, number][] {
  const ranges: [number, number][] = [];
  let open: { char: string; length: number; from: number } | undefined;
  let offset = 0;
  for (const line of source.split('\n')) {
    const [, fence, rest = ''] = FENCE.exec(line) ?? [];
    if (fence !== undefined) {
      const char = fence.charAt(0);
      if (open === undefined) {
        // A backtick fence's info string cannot hold a backtick; such a line
        // is inline code, not a fence.
        if (char !== '`' || !rest.includes('`')) {
          open = { char, length: fence.length, from: offset };
        }
      } else if (char === open.char && fence.length >= open.length && rest.trim() === '') {
        ranges.push([open.from, offset + line.length]);
        open = undefined;
      }
    }
    offset += line.length + 1;
  }
  if (open !== undefined) {
    ranges.push([open.from, source.length]);
  }
  return ranges;
}

/**
 * The 1-based line an offset sits on.
 * @param {string} source - The document.
 * @param {number} offset - An offset into `source`.
 * @returns {number} - The line number.
 */
function lineAt(source: string, offset: number): number {
  return source.slice(0, offset).split('\n').length;
}

/**
 * Locates the body of a section between its markers.
 * @param {string} source - The document.
 * @param {string} name - The section name, matched literally.
 * @returns {SectionSpan} - The body's offsets, or why there is none.
 */
export function locateSection(source: string, name: string): SectionSpan {
  const fences = fencedRanges(source);
  const markers = (kind: 'start' | 'end'): RegExpExecArray[] =>
    [
      ...source.matchAll(
        new RegExp(`(?<![\`\\\\])<!--\\s+${kind}\\s+${escapeRegExp(name)}\\s+-->`, 'g'),
      ),
    ].filter((match) => !fences.some(([from, to]) => match.index >= from && match.index < to));

  const starts = markers('start');
  const ends = markers('end');
  const lines = [...starts, ...ends]
    .map((match) => lineAt(source, match.index))
    .sort((a, b) => a - b);

  if (starts.length === 0 && ends.length === 0) {
    return { found: false, reason: 'missing', lines };
  }
  if (starts.length > 1 || ends.length > 1) {
    return { found: false, reason: 'ambiguous', lines };
  }

  const [start] = starts;
  const [end] = ends;
  const from = start === undefined ? -1 : start.index + start[0].length;
  if (end === undefined || from === -1 || end.index < from) {
    return { found: false, reason: 'unpaired', lines };
  }
  const lineStart = end.index > from && source.charAt(end.index - 1) === '\n';
  return { found: true, start: from, end: lineStart ? end.index - 1 : end.index };
}
