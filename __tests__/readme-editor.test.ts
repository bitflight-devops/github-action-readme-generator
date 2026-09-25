/**
 * Covers ReadmeEditor's formatter scope, which backs the `pretty` action input.
 *
 * The rule under test is `docs/tool-contract.md`'s load-bearing one: text
 * outside a marker pair is the user's. `dumpToFile` formats each span it
 * replaced, in isolation, and writes every other byte back unchanged.
 *
 * Real files in a temp dir rather than a mocked fs: the point of the flag is
 * what ends up on disk, so mocking the write would test nothing.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import ReadmeEditor from '../src/readme-editor.js';

// An unaligned GFM table, matching what src/markdowner emits. Prettier pads the
// columns to a common width, so formatted and unformatted are easy to tell
// apart.
const UNALIGNED = ['| **Input** | **Description** |', '|---|---|', '| a | a longer cell |'].join(
  '\n',
);

const PADDED = [
  '| **Input** | **Description** |',
  '| --------- | --------------- |',
  '| a         | a longer cell   |',
].join('\n');

// Prose prettier would rewrite if it ever reached outside the markers: a
// `*` bullet it normalises to `-`, `__bold__` it normalises to `**bold**`, a
// run of blank lines it collapses, and a trailing space it trims.
const USER_PROSE = ['* a bullet', '* another', '', '', '__bold__   '].join('\n');

const readme = (body: string): string =>
  [`# Title`, '', USER_PROSE, '', '<!-- start inputs -->', body, '<!-- end inputs -->', ''].join(
    '\n',
  );

describe('ReadmeEditor', () => {
  let tempDir: string;
  let readmePath: string;

  const read = (): string => fs.readFileSync(readmePath, 'utf8');

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-readme-editor-'));
    readmePath = path.join(tempDir, 'README.md');
    fs.writeFileSync(readmePath, readme('stale'), 'utf8');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('dumpToFile', () => {
    it('formats the span it replaced', async () => {
      const editor = new ReadmeEditor(readmePath);
      editor.updateSection('inputs', UNALIGNED);

      await editor.dumpToFile();

      expect(read()).toBe(readme(`\n${PADDED}\n`));
    });

    it('leaves every byte outside the markers alone', async () => {
      const before = read();
      const editor = new ReadmeEditor(readmePath);
      editor.updateSection('inputs', UNALIGNED);

      await editor.dumpToFile();

      // Split on the markers and drop the span between them: what is left is
      // the text the tool does not own.
      const outside = (content: string): string[] => {
        const parts = content.split(/<!-- (?:start|end) inputs -->/);
        return [parts.at(0) ?? '', parts.at(-1) ?? ''];
      };

      expect(outside(read())).toStrictEqual(outside(before));
    });

    it('leaves the span unformatted when prettier is disabled', async () => {
      const editor = new ReadmeEditor(readmePath);
      editor.updateSection('inputs', UNALIGNED);

      await editor.dumpToFile(false);

      expect(read()).toBe(readme(`\n${UNALIGNED}\n`));
    });

    // An unpadded span sits inline, where block rules would rewrite it — a
    // leading `+ ` would become a `- ` list item. It is written as composed.
    it('leaves an unpadded span unformatted', async () => {
      const editor = new ReadmeEditor(readmePath);
      editor.updateSection('inputs', '+ New', false);

      await editor.dumpToFile();

      const span = read().split('<!-- start inputs -->')[1]?.split('<!-- end inputs -->')[0] ?? '';
      expect(span).toBe('+ New\n');
    });

    it('collapses the span to bare markers when the section has no content', async () => {
      const editor = new ReadmeEditor(readmePath);
      editor.updateSection('inputs', '');

      await editor.dumpToFile();

      expect(read()).toBe(readme(''));
    });

    describe('line endings', () => {
      const crlf = (text: string): string => text.replaceAll('\n', '\r\n');

      it('writes the generated span with CRLF in a CRLF file', async () => {
        fs.writeFileSync(readmePath, crlf(readme('stale')), 'utf8');
        const editor = new ReadmeEditor(readmePath);
        editor.updateSection('inputs', UNALIGNED);

        await editor.dumpToFile();

        expect(read()).toBe(crlf(readme(`\n${PADDED}\n`)));
      });

      // No single ending reproduces a mixed file, so the bytes outside the
      // markers decide: they stay exactly as they were.
      it('leaves a mixed-ending file outside the markers alone', async () => {
        const mixed = readme('stale').replace('# Title\n', '# Title\r\n');
        fs.writeFileSync(readmePath, mixed, 'utf8');
        const editor = new ReadmeEditor(readmePath);
        editor.updateSection('inputs', UNALIGNED);

        await editor.dumpToFile();

        expect(read().startsWith('# Title\r\n')).toBe(true);
        expect(read().split('<!-- end inputs -->')[1]).toBe(mixed.split('<!-- end inputs -->')[1]);
      });

      // With `pretty` off, so prettier's own LF output cannot be what passes it.
      it('writes CRLF content into an LF file as LF', async () => {
        const editor = new ReadmeEditor(readmePath);
        editor.updateSection('inputs', crlf(UNALIGNED));

        await editor.dumpToFile(false);

        expect(read()).not.toContain('\r');
      });
    });

    it('writes a file it never edited back byte-identical', async () => {
      const before = read();

      await new ReadmeEditor(readmePath).dumpToFile();

      expect(read()).toBe(before);
    });

    it('reaches a fixed point on the second run', async () => {
      const first = new ReadmeEditor(readmePath);
      first.updateSection('inputs', UNALIGNED);
      await first.dumpToFile();
      const formatted = read();

      const second = new ReadmeEditor(readmePath);
      second.updateSection('inputs', UNALIGNED);
      await second.dumpToFile();

      expect(read()).toBe(formatted);
    });

    // Each section's markers are paired again when it is formatted, after
    // every section has been written. A marker that another section wrote into
    // its own span can win that pairing, and the text between such a pair is
    // not the tool's to format.
    describe('when a later section writes one of its markers', () => {
      const layout = (first: string, second: string): string =>
        [
          `<!-- start ${first} -->`,
          `<!-- end ${first} -->`,
          '',
          USER_PROSE,
          '',
          `<!-- start ${second} -->`,
          `<!-- end ${second} -->`,
          '',
        ].join('\n');

      it('does not repeat text when the marker is a start marker', async () => {
        fs.writeFileSync(readmePath, layout('inputs', 'description'), 'utf8');
        const editor = new ReadmeEditor(readmePath);
        editor.updateSection('inputs', UNALIGNED);
        editor.updateSection('description', 'Add <!-- start inputs --> to your README');
        const written = editor.getReadmeContent();

        await editor.dumpToFile();

        expect(read()).toBe(written);
      });

      it('leaves the text outside the markers alone when the marker is an end marker', async () => {
        fs.writeFileSync(readmePath, layout('branding', 'usage'), 'utf8');
        const editor = new ReadmeEditor(readmePath);
        editor.updateSection('branding', '<img src="x" />');
        editor.updateSection(
          'usage',
          ['```yaml', '# `<!-- start branding --><!-- end branding -->`', '```'].join('\n'),
        );
        const written = editor.getReadmeContent();

        await editor.dumpToFile();

        expect(read()).toBe(written);
      });
    });
  });
});
