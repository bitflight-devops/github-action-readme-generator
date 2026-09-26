/**
 * Covers `locateSection`, which decides which bytes of a README are a
 * section's body. Every byte it gets wrong is a byte of the user's text that
 * generation replaces — see `docs/tool-contract.md`.
 */
import { describe, expect, it } from 'vite-plus/test';

import { locateSection } from '../src/markers.js';

/** The body `locateSection` finds, or its reason for finding none. */
const body = (source: string, name = 'inputs'): string => {
  const span = locateSection(source, name);
  return span.found ? source.slice(span.start, span.end) : `<${span.reason}>`;
};

describe('locateSection', () => {
  it('keeps the line break before an end marker that starts its line outside the body', () => {
    expect(body('<!-- start inputs -->\nold\n<!-- end inputs -->\n')).toBe('\nold');
  });

  it('ends the body at the end marker when the marker shares a line with it', () => {
    expect(body('# T\n<!-- start inputs -->old<!-- end inputs -->\n')).toBe('old');
  });

  it('finds an empty body between abutting markers', () => {
    expect(body('<!-- start inputs --><!-- end inputs -->')).toBe('');
    expect(body('<!-- start inputs -->\n<!-- end inputs -->')).toBe('');
  });

  describe('text that looks like a marker', () => {
    it('ignores a marker quoted after a backtick or escaped with a backslash', () => {
      expect(body('`<!-- start inputs -->`\n<!-- start inputs -->\nx\n<!-- end inputs -->')).toBe(
        '\nx',
      );
      expect(body('\\<!-- end inputs -->\n<!-- start inputs -->\nx\n<!-- end inputs -->')).toBe(
        '\nx',
      );
    });

    it.each([
      ['a backtick fence', '```markdown', '```'],
      ['a tilde fence', '~~~', '~~~'],
      ['a fence closed by a longer fence', '```', '`````'],
    ])('ignores markers inside %s', (_label, open, close) => {
      const source = [
        open,
        '<!-- start inputs -->',
        '<!-- end inputs -->',
        close,
        '<!-- start inputs -->',
        'x',
        '<!-- end inputs -->',
        open,
        '<!-- end inputs -->',
        close,
      ].join('\n');

      expect(body(source)).toBe('\nx');
    });

    it('ignores markers inside a fence inside a blockquote', () => {
      const source = ['> ```', '> <!-- end inputs -->', '> ```', '<!-- start inputs -->', 'x'];

      expect(body([...source, '<!-- end inputs -->'].join('\n'))).toBe('\nx');
    });

    it('treats a fence that is never closed as running to the end of the document', () => {
      expect(body('<!-- start inputs -->\nx\n```\n<!-- end inputs -->\n')).toBe('<unpaired>');
    });

    it('does not close a fence on a shorter fence or one of the other character', () => {
      const source = [
        '````',
        '```',
        '~~~~',
        '<!-- start inputs -->',
        '````',
        '<!-- start inputs -->',
      ];

      expect(body([...source, 'x', '<!-- end inputs -->'].join('\n'))).toBe('\nx');
    });

    it('does not open a fence on a backtick line whose info string holds a backtick', () => {
      expect(body('``` `code` ```\n<!-- start inputs -->\nx\n<!-- end inputs -->')).toBe('\nx');
    });
  });

  describe('markers it will not guess between', () => {
    it('reports a section with no markers as missing', () => {
      expect(locateSection('# T\n', 'inputs')).toStrictEqual({
        found: false,
        reason: 'missing',
        lines: [],
      });
    });

    it.each([
      ['a start marker alone', '<!-- start inputs -->\n'],
      ['an end marker alone', '<!-- end inputs -->\n'],
      ['an end marker before the start marker', '<!-- end inputs -->\n<!-- start inputs -->\n'],
    ])('reports %s as unpaired', (_label, source) => {
      expect(body(source)).toBe('<unpaired>');
    });

    // The two shapes of #691: a repeated marker after a real pair.
    it.each([
      ['start', '<!-- start inputs -->'],
      ['end', '<!-- end inputs -->'],
    ])('reports a repeated %s marker as ambiguous, with every line', (_kind, repeat) => {
      const source = ['<!-- start inputs -->', 'x', '<!-- end inputs -->', 'prose', repeat].join(
        '\n',
      );

      expect(locateSection(source, 'inputs')).toStrictEqual({
        found: false,
        reason: 'ambiguous',
        lines: [1, 3, 5],
      });
    });
  });

  // #696: the name is matched literally, not as a pattern.
  it.each([
    ['a.b', 'axb'],
    ['[x]', 'x'],
  ])('matches the name %s literally, not %s', (name, lookalike) => {
    const source = `<!-- start ${lookalike} -->\ny\n<!-- end ${lookalike} -->\n`;

    expect(body(source, name)).toBe('<missing>');
    expect(body(source.replaceAll(lookalike, name), name)).toBe('\ny');
  });
});
