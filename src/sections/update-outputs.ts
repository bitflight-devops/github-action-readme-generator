import { markdownTable } from 'markdown-table';

import type Inputs from '../inputs';
import LogTask from '../logtask';
import updateReadme from '../readme-writer';

export default function updateOutputs(token: string, inputs: Inputs): void {
  const log = new LogTask(token);

  // Build the new README
  const content: string[] = [];
  const markdownArray: string[][] = [['**Output**', '**Description**', '**Default**', '**Required**']];
  const vars = inputs.action.outputs;
  const tI = vars ? Object.keys(vars).length : 0;
  if (tI > 0) {
    log.start();
    for (const key of Object.keys(vars)) {
      // eslint-disable-next-line security/detect-object-injection
      const values = vars[key];
      const row: string[] = [`\`${key.trim()}\``, values?.description?.trim().replace('\n', ' ') ?? ''];
      log.debug(JSON.stringify(row));
      markdownArray.push(row);
    }
    content.push(markdownTable(markdownArray, { align: ['l', 'l'] }));
    log.info(`Action has ${tI} total ${token}`);
    updateReadme(content, token, inputs.readmePath);
    log.success();
  } else {
    log.debug(`Action has no ${token}`);
  }
}
