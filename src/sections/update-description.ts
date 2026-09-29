/**
 * This TypeScript code exports a function named 'updateDescription' which takes a sectionToken (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the description section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes.
 * @param {ReadmeSection} sectionToken - The sectionToken representing the section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import type { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
import * as markdown from 'prettier/plugins/markdown';

import LogTask from '../logtask/index.js';

/** The parts of a Markdown AST node this module reads. */
interface MarkdownNode {
  type: string;
  position?: { start: { offset: number }; end: { offset: number } };
  children?: MarkdownNode[];
}

/**
 * The 0-based first and last line of each fenced code block in `text`.
 *
 * Found with the markdown parser prettier already bundles, so a fence inside
 * a list or a blockquote, or a line that only opens an inline code span,
 * follows Markdown's rules. Indented code blocks are not included: their
 * lines are treated as prose.
 * @param {string} text - The description, with LF line endings.
 * @returns {Array<[number, number]>} - The line ranges, inclusive.
 */
function fencedLines(text: string): [number, number][] {
  const lineOf = (offset: number): number => text.slice(0, offset).split('\n').length - 1;
  const ranges: [number, number][] = [];
  const walk = (node: MarkdownNode): void => {
    const { position } = node;
    if (node.type === 'code' && position) {
      const source = text.slice(position.start.offset, position.end.offset).trimStart();
      if (source.startsWith('```') || source.startsWith('~~~')) {
        ranges.push([lineOf(position.start.offset), lineOf(position.end.offset)]);
      }
    }
    for (const child of node.children ?? []) {
      walk(child);
    }
  };
  walk(markdown.parsers.markdown.parse(text, {} as never) as MarkdownNode);
  return ranges;
}

/**
 * Converts an action.yml description to the Markdown of the description
 * section.
 *
 * Prose is squashed and its blank lines become `<br />`. A fenced code block
 * keeps its own lines, verbatim, with a blank line between it and the prose
 * around it — see #705.
 * @param {string} description - The description from action.yml.
 * @returns {string} - The section's Markdown.
 */
export function descriptionMarkdown(description: string): string {
  const text = description.trim().replaceAll('\r\n', '\n');
  const fences = fencedLines(text);
  const segments: { code: boolean; lines: string[] }[] = [];
  for (const [index, line] of text.split('\n').entries()) {
    const code = fences.some(([first, last]) => index >= first && index <= last);
    const last = segments.at(-1);
    if (last?.code === code) {
      last.lines.push(line);
    } else {
      segments.push({ code, lines: [line] });
    }
  }

  return segments
    .map(({ code, lines }) => {
      const block = lines.join('\n');
      return code
        ? block
        : block
            .trim()
            .replaceAll(/ +/g, ' ') // Squash consecutive spaces
            .replaceAll(' \n', '\n') // Squash space followed by newline
            .replaceAll('\n\n', '<br />'); // Convert double return to a break
    })
    .filter((block) => block !== '')
    .join('\n\n');
}

export default function updateDescription(
  sectionToken: ReadmeSection,
  inputs: Inputs,
): Record<string, string> {
  const log = new LogTask(sectionToken);

  // Build the new README
  const content: string[] = [];

  // Build the new description section
  if (inputs?.action?.description) {
    log.start();
    const desc = descriptionMarkdown(inputs.action.description);

    log.info(`Writing ${desc.length} characters to the description section`);
    content.push(desc);
    inputs.readmeEditor.updateSection(sectionToken, content);
    log.success();
  }
  const ret: Record<string, string> = {};
  ret[sectionToken] = content.join('\n');
  return ret;
}
