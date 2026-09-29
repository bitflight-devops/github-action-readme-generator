/**
 * Covers how an action.yml description becomes the description section.
 */
import { describe, expect, it } from 'vite-plus/test';

import { formatMarkdown } from '../src/prettier.js';
import { descriptionMarkdown } from '../src/sections/update-description.js';

describe('descriptionMarkdown', () => {
  it('trims the description and keeps its lines as written', () => {
    expect(descriptionMarkdown('  One  line \nnext\n\nNew  paragraph  ')).toBe(
      'One  line \nnext\n\nNew  paragraph',
    );
  });

  it('reads CRLF line endings as LF', () => {
    expect(descriptionMarkdown('A\r\n\r\nB')).toBe('A\n\nB');
  });

  // #711: blank lines and indentation carry the structure of block Markdown.
  it('keeps a list whose item holds a fenced code block', () => {
    const description = [
      'Does things.',
      '',
      '- Run:',
      '',
      '    ```yaml',
      '    uses:  x',
      '    ```',
    ].join('\n');

    expect(descriptionMarkdown(description)).toBe(description);
  });

  it('keeps an indented code block', () => {
    expect(descriptionMarkdown('Intro\n\n    indented  line')).toBe('Intro\n\n    indented  line');
  });
});

describe('the formatted description section', () => {
  const section = async (description: string): Promise<string> =>
    (await formatMarkdown(`\n${descriptionMarkdown(description)}`)).trim();

  it('keeps paragraphs, lists and fences as block Markdown', async () => {
    const description = [
      'Does  things.',
      '',
      'Second paragraph.',
      '',
      '- Run:',
      '',
      '    ```yaml',
      '    uses:  x',
      '    ```',
      '',
      '- Done',
    ].join('\n');

    expect(await section(description)).toBe(
      [
        'Does things.',
        '',
        'Second paragraph.',
        '',
        '- Run:',
        '',
        '  ```yaml',
        '  uses: x',
        '  ```',
        '',
        '- Done',
      ].join('\n'),
    );
  });

  it('is stable when formatted again', async () => {
    const once = await section('Intro\n\n- a\n\n  more of a\n- b\n\n    code');

    expect(await section(once)).toBe(once);
  });
});
