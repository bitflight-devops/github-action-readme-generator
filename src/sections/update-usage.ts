import nconf from 'nconf';

import { wrapText } from '../helpers';
import type Inputs from '../inputs';
import LogTask from '../logtask';
import updateReadme from '../readme-writer';

export default function updateUsage(token: string, inputs: Inputs): void {
  const log = new LogTask(token);
  const actionName = `${nconf.get('owner') as string}/${nconf.get('repo')}`;
  log.info(`Action name: ${actionName}`);
  let versionString: string;
  if ((nconf.get('versioning:enabled') as string) === 'true') {
    const oRide = nconf.get('versioning:override') as string;
    versionString =
      oRide && oRide.length > 0 ? oRide : process.env['npm_package_version'] ?? '0.0.0';

    if (versionString && !versionString.startsWith(nconf.get('versioning:prefix') as string)) {
      versionString = `${nconf.get('versioning:prefix') as string}${versionString}`;
    }
  } else {
    versionString = nconf.get('versioning:branch') as string;
  }
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
    Object.keys(inp).forEach((key) => {
      // eslint-disable-next-line security/detect-object-injection
      const input = inp[key];
      if (input !== undefined) {
        // Line break between inputs
        if (!firstInput) {
          content.push('');
        }

        // Constrain the width of the description, and append it
        wrapText(input.description, content, '    # ');

        if (input.default !== undefined) {
          // Append blank line if description had paragraphs
          if (input.description?.trimEnd().match(/\n[ ]*\r?\n/)) {
            content.push(`    #`);
          }

          // Default
          content.push(`    # Default: ${input.default}`);
        }

        // Input name
        content.push(`    ${key}: ''`);

        firstInput = false;
      }
    });
  }

  content.push('```\n');

  updateReadme(content, token, inputs.readmePath);
}
