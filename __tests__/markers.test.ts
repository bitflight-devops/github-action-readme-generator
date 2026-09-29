/**
 * Covers `locateSection`, which decides which bytes of a README are a
 * section's body. Every byte it gets wrong is a byte of the user's text that
 * generation replaces — see `docs/tool-contract.md`.
 */
import { describe, expect, it } from 'vite-plus/test';

import { diagnoseMarkers, locateSection } from '../src/markers.js';

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

  // A fence that nothing closes runs to the end of the document, and markers
  // inside it still count, so it cannot hide the pairs after it.
  it('locates pairs inside and after a fence that nothing closes', () => {
    const source = `<!-- start description -->\n\`\`\`\n<!-- end description -->\n${afterExample()}`;

    expect(body(source, 'description')).toBe('\n```');
    expect(body(source)).toBe('\nx');
  });

  describe('markers inside closed code', () => {
    it('does not pair a start marker with an end marker in a later code example', () => {
      const source = ['<!-- start inputs -->', 'prose', '```', '<!-- end inputs -->', '```'].join(
        '\n',
      );

      expect(body(source)).toBe('<unpaired>');
    });

    it.each([
      ['a fenced code block', ['```', '<!-- start inputs -->', '<!-- end inputs -->', '```']],
      ['inline code', ['Add `x <!-- start inputs --><!-- end inputs -->` to your README.']],
      [
        'inline code opened by triple backticks',
        ['Add ```x <!-- start inputs --><!-- end inputs -->``` to your README.'],
      ],
    ])('reports a pair that is only an example in %s as missing', (_label, example) => {
      expect(body(example.join('\n'))).toBe('<missing>');
    });
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

describe('diagnoseMarkers', () => {
  const sections = ['title', 'inputs', 'outputs'];

  it.each([
    ['a missing letter', 'input', 'inputs'],
    ['a different case', 'Inputs', 'inputs'],
    ['a transposition', 'otuputs', 'outputs'],
  ])('suggests the section for a name with %s', (_label, name, section) => {
    const source = `<!-- start title -->\n<!-- end title -->\n\n<!-- start ${name} -->\n`;

    expect(diagnoseMarkers(source, sections)).toStrictEqual([
      `The marker <!-- start ${name} --> on line 4 names no section. Did you mean '${section}'?`,
    ]);
  });

  // README.example.md carries a `[.github/ghadocs/examples/]` marker that
  // nothing fills, and other tools use the same comment syntax.
  it('ignores a marker name that is not close to any section', () => {
    const source = [
      '<!-- start title -->',
      '<!-- end title -->',
      '<!-- start [.github/ghadocs/examples/] -->',
      '<!-- end [.github/ghadocs/examples/] -->',
    ].join('\n');

    expect(diagnoseMarkers(source, sections)).toStrictEqual([]);
  });

  // A single pair counts wherever it sits, as in `locateSection`: generated
  // text can hold an unclosed fence, which would otherwise hide the pair.
  it('reports a single mistyped pair after an unclosed fence', () => {
    const source = [
      '<!-- start title -->',
      '```',
      '<!-- end title -->',
      '<!-- start input -->',
      '<!-- end input -->',
    ].join('\n');

    expect(diagnoseMarkers(source, sections)).toStrictEqual([
      "The marker <!-- start input --> on line 4 names no section. Did you mean 'inputs'?",
      "The marker <!-- end input --> on line 5 names no section. Did you mean 'inputs'?",
    ]);
  });

  // One mistyped side splits the pair across two names; the pair rule has to
  // see both sides to know the pair counts.
  it('reports a pair with one mistyped side after an unclosed fence', () => {
    const source = [
      '<!-- start title -->',
      '```',
      '<!-- end title -->',
      '<!-- start input -->',
      '<!-- end inputs -->',
    ].join('\n');

    expect(diagnoseMarkers(source, sections)).toStrictEqual([
      "The marker <!-- start input --> on line 4 names no section. Did you mean 'inputs'?",
    ]);
  });

  it('ignores a mistyped example inside code next to a real pair', () => {
    const source = [
      '```',
      '<!-- start input -->',
      '```',
      '<!-- start inputs -->',
      '<!-- end inputs -->',
    ].join('\n');

    expect(diagnoseMarkers(source, sections)).toStrictEqual([]);
  });

  // A real start marker and a mistyped example end marker in closed code are
  // not a pair.
  it('ignores a mistyped example in closed code after a real start marker', () => {
    const source = ['<!-- start inputs -->', '```', '<!-- end input -->', '```'].join('\n');

    expect(diagnoseMarkers(source, sections)).toStrictEqual([]);
  });

  it.each([
    ['inline code opened by triple backticks', 'Use ```x <!-- start input -->``` here.'],
    ['an indented code block opening with backticks', 'para\n\n    ```\n    <!-- start input -->'],
  ])('ignores a mistyped marker in %s', (_label, example) => {
    const source = `<!-- start title -->\n<!-- end title -->\n\n${example}\n`;

    expect(diagnoseMarkers(source, sections)).toStrictEqual([]);
  });

  it('ignores a mistyped marker quoted in inline code', () => {
    const source =
      '<!-- start title -->\n<!-- end title -->\n\nUse `x <!-- start input -->` here.\n';

    expect(diagnoseMarkers(source, sections)).toStrictEqual([]);
  });

  it('ignores a mistyped marker inside code', () => {
    const source = '<!-- start title -->\n<!-- end title -->\n\n```\n<!-- start input -->\n```\n';

    expect(diagnoseMarkers(source, sections)).toStrictEqual([]);
  });

  it('reports a README with no section markers once', () => {
    const [warning, ...rest] = diagnoseMarkers('# README\n', sections);

    expect(warning).toContain('The README has no markers for the sections being generated');
    expect(rest).toStrictEqual([]);
  });

  // `--sections=inputs` against a README with only a title pair generates
  // nothing, so the warning is about the requested sections.
  it('reports missing markers for the requested sections only', () => {
    const source = '<!-- start title -->\n<!-- end title -->\n';

    expect(diagnoseMarkers(source, sections, ['inputs'])).toStrictEqual([
      'The README has no markers for the sections being generated (inputs), so nothing was generated. Add a pair such as <!-- start inputs --> and <!-- end inputs --> where each section belongs; README.example.md shows every section.',
    ]);
    expect(diagnoseMarkers(source, sections, ['title'])).toStrictEqual([]);
    expect(diagnoseMarkers(source, sections, [])).toStrictEqual([]);
  });

  it('does not report a README whose only section marker is unpaired as having none', () => {
    expect(diagnoseMarkers('<!-- start inputs -->\n', sections)).toStrictEqual([]);
  });
});
