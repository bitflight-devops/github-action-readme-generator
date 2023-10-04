import { getCurrentVersionString } from '../helpers';
import type Inputs from '../inputs';
import LogTask from '../logtask';
import { wrapDescription } from '../prettier';
import readmeWriter from '../readme-writer';

export default async function updateUsage(token: string, inputs: Inputs): Promise<void> {
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
  if (inp) {
    for (const key of Object.keys(inp)) {
      const input = inp[key];
      if (input !== undefined) {
        // Line break between inputs
        if (!firstInput) {
          content.push('');
        }

        // Constrain the width of the description, and append it
        wrapDescription(input.description, content, '    # ');

        if (input.default !== undefined) {
          // Append blank line if description had paragraphs
          if (input.description?.trimEnd().match(/\n *\r?\n/)) {
            content.push('    #');
          }

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

  await readmeWriter(content, token, inputs.readmePath);
  log.success();
}
