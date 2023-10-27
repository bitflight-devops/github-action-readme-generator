import { getCurrentVersionString } from '../helpers.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';
import { wrapDescription } from '../prettier.js';
import type { ReadmeSection } from './index.js';

type DescriptionType = Record<string, string[]>;
export default async function updateUsage(token: ReadmeSection, inputs: Inputs): Promise<void> {
  const log = new LogTask(token);
  log.start();
  const actionName = `${inputs.config.get('owner') as string}/${inputs.config.get('repo')}`;
  log.info(`Action name: ${actionName}`);
  const versionString: string = getCurrentVersionString(inputs);

  log.info(`Version string: ${versionString}`);

  const actionReference = `${actionName}@${versionString}`;

  if (!actionReference) {
    throw new Error('Parameter actionReference must not be empty');
  }

  // Build the new README
  const content: string[] = [];
  // Build the new usage section
  content.push('```yaml', `- uses: ${actionReference}`, '  with:');

  const inp = inputs.action.inputs;
  let firstInput = true;
  const descriptionPromises: Record<string, Promise<string[]>> = {};
  for (const key of Object.keys(inp)) {
    const input = inp[key];
    if (input !== undefined) {
      descriptionPromises[key] = wrapDescription(`Description: ${input.description}`, [], '    # ');
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
    log.info(`${e.key}: ${descriptions[e.key].join('\n')}`);
  }

  if (inp) {
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
          // Append blank line if description had paragraphs
          // if (input.description?.trimEnd().match(/\n *\r?\n/)) {
          //   content.push('    #');
          // }

          // Default
          content.push(`    # Default: ${input.default}`);
        }

        // Input name
        content.push(`    ${key}: ''`);

        firstInput = false;
      }
    }
  }

  content.push('```\n');

  inputs.readmeEditor.updateSection(token, content);
  log.success();
}
