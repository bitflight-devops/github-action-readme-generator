/**
 * Covers how an action.yml description becomes the description section.
 */
import { describe, expect, it } from 'vite-plus/test';

import { descriptionMarkdown } from '../src/sections/update-description.js';

describe('descriptionMarkdown', () => {
  it('squashes prose and turns blank lines into breaks', () => {
    expect(descriptionMarkdown('  One  line \nnext\n\nNew  paragraph  ')).toBe(
      'One line\nnext<br />New paragraph',
    );
  });

  it('reads CRLF line endings as LF', () => {
    expect(descriptionMarkdown('A\r\n\r\nB')).toBe('A<br />B');
  });

  // #705: a fence keeps its own lines, set apart from the prose by blank lines.
  it('keeps a fenced code block verbatim on lines of its own', () => {
    const description = [
      'Does  things.',
      '',
      '```yaml',
      'uses:  x',
      '',
      '  with: y',
      '```',
      '',
      'After  it.',
    ].join('\n');

    expect(descriptionMarkdown(description)).toBe(
      ['Does things.', '', '```yaml', 'uses:  x', '', '  with: y', '```', '', 'After it.'].join(
        '\n',
      ),
    );
  });

  it('closes a fence only on a fence of the same character and at least its length', () => {
    const description = ['````', '```', '~~~~', '````', 'after'].join('\n');

    expect(descriptionMarkdown(description)).toBe(
      ['````', '```', '~~~~', '````', '', 'after'].join('\n'),
    );
  });

  it('keeps an unclosed fence to the end, as it renders', () => {
    expect(descriptionMarkdown('Intro\n\n~~~\nopen  only')).toBe('Intro\n\n~~~\nopen  only');
  });

  // A backtick fence's info string cannot hold a backtick, so this line is an
  // inline code span.
  it('reads a line opening with an inline code span as prose', () => {
    expect(descriptionMarkdown('```code``` is  prose\n\nnext  para')).toBe(
      '```code``` is prose<br />next para',
    );
  });

  it('keeps a fenced code block inside a list item verbatim', () => {
    const description = ['- Run:', '', '    ```yaml', '    uses:  x', '', '    ```', '- Done'].join(
      '\n',
    );

    expect(descriptionMarkdown(description)).toBe(
      ['- Run:', '', '    ```yaml', '    uses:  x', '', '    ```', '', '- Done'].join('\n'),
    );
  });

  it('squashes an indented code block as prose, as before', () => {
    expect(descriptionMarkdown('Intro\n\n    indented  line')).toBe('Intro<br /> indented line');
  });

  it('leaves backticks that do not start a line as prose', () => {
    expect(descriptionMarkdown('Use ```  inline')).toBe('Use ``` inline');
  });
});
