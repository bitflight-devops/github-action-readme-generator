import type { ReadmeSection } from '../constants.js';
import { getCurrentVersionString } from '../helpers.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';
import { wrapDescription } from '../prettier.js';

type DescriptionType = Record<string, string[]>;

/**
 * Renders the `usage` section: a fenced workflow snippet naming every action input,
 * each preceded by its description and default as YAML comments.
 * @param {ReadmeSection} sectionToken - The README marker pair to write the section into.
 * @param {Inputs} inputs - The parsed action metadata and the README editor to write with.
 * @returns {Promise<Record<string, string>>} The rendered section, keyed by its section token.
 */
export default async function updateUsage(
  sectionToken: ReadmeSection,
  inputs: Inputs,
): Promise<Record<string, string>> {
  const log = new LogTask(sectionToken);
  log.start();

  const actionName = `${inputs.owner}/${inputs.repo}`;
  log.info(`Action name: ${actionName}`);
  const versionString: string = getCurrentVersionString(inputs);

  log.info(`Version string: ${versionString}`);

  const actionReference = `${actionName}@${versionString}`;

  const indent = '    # ';
  const defaultLabel = 'Default: ';
  const defaultHang = ' '.repeat(defaultLabel.length);
  // Build the new README
  const content: string[] = [];
  // Build the new usage section
  content.push('```yaml', `- uses: ${actionReference}`, '  with:');

  const inp = inputs.action.inputs;
  let firstInput = true;
  const descriptionPromises: Record<string, Promise<string[]>> = {};
  if (inp) {
    for (const key of Object.keys(inp)) {
      const input = inp[key];
      if (input !== undefined) {
        descriptionPromises[key] = wrapDescription(`Description: ${input.description}`, [], indent);
      }
    }

    const descriptions: DescriptionType = {};
    const kvArray = await Promise.all(
      Object.keys(descriptionPromises).map(async (key) => {
        return { key, value: await descriptionPromises[key] };
      }),
    );
    for (const e of kvArray) {
      descriptions[e.key] = e.value;
      log.debug(`${e.key}: ${descriptions[e.key].join('\n')}`);
    }

    for (const key of Object.keys(inp)) {
      const input = inp[key];
      if (input !== undefined) {
        // Line break between inputs
        if (!firstInput) {
          content.push('');
        }

        // Constrain the width of the description, and append it
        content.push(...descriptions[key]);

        if (input.default !== undefined) {
          // Default. Every line stays inside the comment: a bare continuation line
          // sits at column 0 and the fence stops being YAML. Continuation lines hang
          // under the value, so a multi-line default does not read as more prose.
          const [firstLine, ...rest] = `${input.default}`.split(/\r\n|\n|\r/);
          content.push(`${indent}${defaultLabel}${firstLine}`.trimEnd());
          for (const line of rest) {
            content.push(`${indent}${defaultHang}${line}`.trimEnd());
          }
        }

        // Input name
        content.push(`    ${key}: ''`);

        firstInput = false;
      }
    }
  }

  content.push('```\n');

  inputs.readmeEditor.updateSection(sectionToken, content);
  log.success();
  const ret: Record<string, string> = {};
  ret[sectionToken] = content.join('\n');
  return ret;
}
