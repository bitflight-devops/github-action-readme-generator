/**
 * This TypeScript code exports a function named 'updateDescription' which takes a sectionToken (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the description section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes.
 * @param {ReadmeSection} sectionToken - The sectionToken representing the section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import type { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';

/** A fence opener or closer: three or more backticks or tildes. */
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/**
 * Converts an action.yml description to the Markdown of the description
 * section.
 *
 * Prose is squashed and its blank lines become `<br />`. A fenced code block
 * is kept verbatim on lines of its own: flattening the blank line before it
 * would move its opening fence mid-line, leaving the closing fence to open a
 * fence that nothing closes.
 * @param {string} description - The description from action.yml.
 * @returns {string} - The section's Markdown.
 */
export function descriptionMarkdown(description: string): string {
  const segments: { code: boolean; lines: string[] }[] = [];
  let fence: string | undefined;
  for (const line of description.trim().replaceAll('\r\n', '\n').split('\n')) {
    const marker = FENCE.exec(line)?.[1];
    if (fence === undefined && marker !== undefined) {
      fence = marker;
      segments.push({ code: true, lines: [line] });
      continue;
    }
    const last = segments.at(-1);
    if (fence !== undefined && last !== undefined) {
      last.lines.push(line);
      const closes =
        marker?.charAt(0) === fence.charAt(0) &&
        marker.length >= fence.length &&
        line.trim() === marker;
      if (closes) {
        fence = undefined;
      }
    } else if (last === undefined || last.code) {
      segments.push({ code: false, lines: [line] });
    } else {
      last.lines.push(line);
    }
  }

  return segments
    .map(({ code, lines }) => {
      const text = lines.join('\n');
      return code
        ? text
        : text
            .trim()
            .replaceAll(/ +/g, ' ') // Squash consecutive spaces
            .replaceAll(' \n', '\n') // Squash space followed by newline
            .replaceAll('\n\n', '<br />'); // Convert double return to a break
    })
    .filter((text) => text !== '')
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
