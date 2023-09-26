import type Inputs from '../inputs';
import LogTask from '../logtask';
import markdowner from '../markdowner';
import updateReadme from '../readme-writer';

export default function updateOutputs(token: string, inputs: Inputs): void {
  const log = new LogTask(token);

  // Build the new README
  const content: string[] = [];
  const markdownArray: string[][] = [
    ['**Output**', '**Description**', '**Default**', '**Required**'],
  ];
  const vars = inputs.action.outputs;
  const tI = vars ? Object.keys(vars).length : 0;
  if (tI > 0) {
    log.start();
    for (const key of Object.keys(vars)) {
      // eslint-disable-next-line security/detect-object-injection
      const values = vars[key];

      let description = values?.description ?? '';

      // Check if only first line should be added (only subject without body)
      // eslint-disable-next-line no-useless-escape
      const matches = description.match('(.*?)\n\n([Ss]*)');
      if (matches && matches.length >= 2) {
        description = matches[1] || description;
      }

      description = description.trim().replace('\n', '<br />');

      const row: string[] = [`\`${key.trim()}\``, description];
      log.debug(JSON.stringify(row));
      markdownArray.push(row);
    }
    content.push(markdowner(markdownArray));
    log.info(`Action has ${tI} total ${token}`);
    updateReadme(content, token, inputs.readmePath);
    log.success();
  } else {
    log.debug(`Action has no ${token}`);
  }
}
