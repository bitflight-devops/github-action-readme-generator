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

    it('collapses the span to bare markers when the section has no content', async () => {
      const editor = new ReadmeEditor(readmePath);
      editor.updateSection('inputs', '');

      await editor.dumpToFile();

      expect(read()).toBe(readme(''));
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
  });
});
