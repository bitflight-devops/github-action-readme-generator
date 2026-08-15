/**
 * This TypeScript code exports two functions: `formatMarkdown` and `wrapDescription`.
 *
 * - `formatMarkdown` takes a Markdown string and an optional filepath as parameters and uses `prettier` to format the Markdown code. It returns the formatted Markdown string.
 * - `wrapDescription` takes a string value, an array of content, and an optional prefix as parameters. It wraps the description text with the specified prefix and formats it using `prettier`. It returns the updated content array with the formatted description lines.
 *
 * Both go through `prettier/standalone` rather than the `prettier` package root. The
 * root entry lazily `import()`s whichever language plugin a parser needs, which drags
 * the whole installed package into the bundled CLI binary; `standalone` takes its
 * plugins as an explicit list instead. Output is unchanged — see `plugins` below for
 * why this particular set.
 */

import type { Plugin } from 'prettier';
import * as markdown from 'prettier/plugins/markdown';
import * as yaml from 'prettier/plugins/yaml';
import { format } from 'prettier/standalone';

import LogTask from './logtask/index.js';

const log: LogTask = new LogTask('prettier');

/**
 * The languages a GitHub Action's README is known in advance to contain.
 *
 * `markdown` is the parser itself. `yaml` covers the workflow snippets that are
 * what an action README is mostly made of — and the ```yaml usage block this
 * tool generates.
 *
 * Nothing else is bundled. `embeddedLanguageFormatting: 'auto'` reformats fenced
 * code blocks, and `standalone` silently leaves a fence alone when its plugin is
 * absent, so this list is exactly the set of fences the tool reformats. That is
 * the intended contract, not a gap: this tool exists for GitHub Actions, and a
 * fence in some other language is prose the action's author wrote, which the
 * tool has no business rewriting.
 *
 * The bar for adding one: a language that action READMEs are known in advance
 * to contain, not one they could. Every plugin here is weight in a binary that
 * ships to every consumer, spent to reformat code the action's author wrote.
 *
 * Extending this per-project — naming extra prettier plugins in configuration —
 * is tracked separately; see the README.
 *
 * Exported so __tests__/prettier.test.ts derives the formatted-parser set from
 * this array rather than restating it: a hand-written copy misfiles every
 * parser it forgets, and `markdown` alone provides three (`markdown`, `mdx`,
 * `remark`).
 */
export const plugins: Plugin[] = [markdown, yaml];

/**
 * Formats a Markdown string using `prettier`.
 * @param {string} value - The Markdown string to format.
 * @param {string} [filepath] - The optional filepath.
 * @returns {Promise<string>} A promise that resolves with the formatted Markdown string.
 */
export async function formatMarkdown(value: string, filepath?: string): Promise<string> {
  const fp = filepath ? { filepath } : {};
  return await format(value, {
    semi: false,
    parser: 'markdown',
    embeddedLanguageFormatting: 'auto',
    plugins,
    ...fp,
  });
}

/**
 * Wraps a description text with a prefix and formats it using `prettier`.
 * @param {string | undefined} value - The description text to wrap and format.
 * @param {string[]} content - The array of content to update.
 * @param {string} [prefix='    # '] - The optional prefix to wrap the description lines.
 * @returns {Promise<string[]>} A promise that resolves with the updated content array.
 */
export async function wrapDescription(
  value: string | undefined,
  content: string[],
  prefix: string = '    # ',
): Promise<string[]> {
  if (!value) {
    return content ?? [];
  }
  let formattedString = '';
  try {
    formattedString = await format(value, {
      semi: false,
      parser: 'markdown',
      proseWrap: 'always',
      plugins,
    });
  } catch (error) {
    log.error(`${String(error)}`);
  }

  content.push(...formattedString.split('\n').map((line) => prefix + line.replace(prefix, '')));
  return content;
}
