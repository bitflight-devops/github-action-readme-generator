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

/** A real pair, preceded by an example of the same markers. */
const afterExample = (...example: string[]): string =>
  [...example, '<!-- start inputs -->', 'x', '<!-- end inputs -->', ''].join('\n');

describe('locateSection', () => {
  describe('the end of the body', () => {
    it('leaves the line break before an end marker that starts its line to the marker', () => {
      expect(body('<!-- start inputs -->\nold\n<!-- end inputs -->\n')).toBe('\nold');
    });

    it('leaves the indentation before an end marker to the marker', () => {
      expect(body('<details>\n  <!-- start inputs -->\n  old\n  <!-- end inputs -->\n')).toBe(
        '\n  old',
      );
    });

    it('ends at the end marker when the marker shares a line with the body', () => {
      expect(body('# T\n<!-- start inputs -->old<!-- end inputs -->\n')).toBe('old');
    });

    it('finds an empty body between abutting markers', () => {
      expect(body('<!-- start inputs --><!-- end inputs -->')).toBe('');
      expect(body('<!-- start inputs -->\n<!-- end inputs -->')).toBe('');
    });
  });

  it('ignores a marker quoted after a backtick or escaped with a backslash', () => {
    expect(body(afterExample('`<!-- start inputs -->`'))).toBe('\nx');
    expect(body(afterExample('\\<!-- end inputs -->'))).toBe('\nx');
  });

  // A single pair is located wherever it sits. Generated text can hold an
  // unclosed fence — a description whose fence the description updater
  // flattened — and code detection must not let it hide the pairs after it.
  it('locates a single pair even after an unclosed fence', () => {
    expect(
      body(`<!-- start description -->\n\`\`\`\n<!-- end description -->\n${afterExample()}`),
    ).toBe('\nx');
  });

  // #691: a README that documents the markers repeats them.
  describe('when a marker repeats', () => {
    it.each([
      ['a backtick fence', ['```markdown', '<!-- start inputs -->', '<!-- end inputs -->', '```']],
      ['a tilde fence', ['~~~', '<!-- start inputs -->', '~~~']],
      ['an indented code block', ['para', '', '    <!-- start inputs -->', '']],
      ['a fence in a list item', ['- item', '  ```', '  <!-- start inputs -->', '  ```', '']],
      ['a fence in a blockquote', ['> ```', '> <!-- end inputs -->', '> ```', '']],
      ['inline code with text before it', ['Use `<!-- start inputs --><!-- end inputs -->` here.']],
    ])('sets aside the markers inside %s', (_label, example) => {
      expect(body(afterExample(...example))).toBe('\nx');
    });

    it.each([
      ['a fence its blockquote closes', ['> ```', '> x', '']],
      ['a fence indented four spaces', ['para', '    ```not a fence', '']],
      ['a fence inside an HTML block', ['<div>', '```', '</div>', '']],
    ])('does not let %s hide the real pair', (_label, preamble) => {
      const source = afterExample(...preamble, '```', '<!-- start inputs -->', '```', '');

      expect(body(source)).toBe('\nx');
    });

    it('reads fences on CRLF lines in a file that mixes line endings', () => {
      expect(body(afterExample('```\r', '<!-- start inputs -->\r', '```\r'))).toBe('\nx');
    });

    it('reads a fence on the first line after a byte order mark', () => {
      expect(body(`﻿${afterExample('```', '<!-- start inputs -->', '```')}`)).toBe('\nx');
    });

    it.each([
      ['start', '<!-- start inputs -->'],
      ['end', '<!-- end inputs -->'],
    ])(
      'reports a repeated %s marker outside code as ambiguous, with its lines',
      (_kind, repeat) => {
        const source = ['<!-- start inputs -->', 'x', '<!-- end inputs -->', 'prose', repeat].join(
          '\n',
        );

        expect(locateSection(source, 'inputs')).toStrictEqual({
          found: false,
          reason: 'ambiguous',
          lines: [1, 3, 5],
        });
      },
    );

    // This repository's own usage block quotes `branding_svg_path`'s
    // description, whose end marker sits in inline code inside a fence.
    it('sets aside a lone marker inside code instead of reporting it unpaired', () => {
      expect(body('```yaml\n# `<!-- start inputs --><!-- end inputs -->`\n```\n')).toBe(
        '<missing>',
      );
    });

    it('reports markers that are all examples as missing', () => {
      const example = ['```', '<!-- start inputs -->', '<!-- end inputs -->', '```'];

      expect(body([...example, ...example].join('\n'))).toBe('<missing>');
    });
  });

  describe('markers it will not pair', () => {
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
