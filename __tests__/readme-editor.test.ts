/**
 * Covers ReadmeEditor.dumpToFile's `prettier` toggle, which backs the `pretty`
 * action input. Real files in a temp dir rather than a mocked fs: the point of
 * the flag is what ends up on disk, so mocking the write would test nothing.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';

import ReadmeEditor from '../src/readme-editor.js';

// An unaligned GFM table, matching what src/markdowner emits. Prettier pads the
// columns to a common width, so the two modes are easy to tell apart.
const UNALIGNED = ['| **Input** | **Description** |', '|---|---|', '| a | a longer cell |'].join(
  '\n',
);

describe('ReadmeEditor', () => {
  let tempDir: string;
  let readmePath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-readme-editor-'));
    readmePath = path.join(tempDir, 'README.md');
    fs.writeFileSync(readmePath, `# Title\n\n${UNALIGNED}\n`, 'utf8');
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('dumpToFile', () => {
    it('formats with prettier by default', async () => {
      await new ReadmeEditor(readmePath).dumpToFile();

      expect(fs.readFileSync(readmePath, 'utf8')).toBe(
        [
          '# Title',
          '',
          '| **Input** | **Description** |',
          '| --------- | --------------- |',
          '| a         | a longer cell   |',
          '',
        ].join('\n'),
      );
    });

    it('formats with prettier when explicitly enabled', async () => {
      await new ReadmeEditor(readmePath).dumpToFile(true);

      expect(fs.readFileSync(readmePath, 'utf8')).toContain('| --------- |');
    });

    it('writes the content untouched when prettier is disabled', async () => {
      const before = fs.readFileSync(readmePath, 'utf8');

      await new ReadmeEditor(readmePath).dumpToFile(false);

      expect(fs.readFileSync(readmePath, 'utf8')).toBe(before);
    });

    it('leaves an already-formatted file unchanged either way', async () => {
      await new ReadmeEditor(readmePath).dumpToFile();
      const formatted = fs.readFileSync(readmePath, 'utf8');

      await new ReadmeEditor(readmePath).dumpToFile(false);

      expect(fs.readFileSync(readmePath, 'utf8')).toBe(formatted);
    });
  });
});
