import { columnHeader, rowHeader } from '../helpers';
import type Inputs from '../inputs';
import LogTask from '../logtask';
import markdowner from '../markdowner';
import updateReadme from '../readme-writer';

export default async function updateOutputs(token: string, inputs: Inputs): Promise<void> {
  const log = new LogTask(token);

  // Build the new README
  const content: string[] = [];

  const markdownArray: string[][] = [];
  const titleArray = ['Output', 'Description'];
  const titles: string[] = [];
  for (const t of titleArray) {
    titles.push(columnHeader(t));
  }
  markdownArray.push(titles);
  const vars = inputs.action.outputs;
  const tI = vars ? Object.keys(vars).length : 0;
  if (tI > 0) {
    log.start();
    for (const key of Object.keys(vars)) {
      const values = vars[key];
      const row: string[] = [rowHeader(key), values?.description?.trim().replace('\n', ' ') ?? ''];
      log.debug(JSON.stringify(row));
      markdownArray.push(row);
    }
    content.push(markdowner(markdownArray));
    log.info(`Action has ${tI} total ${token}`);
    await updateReadme(content, token, inputs.readmePath);
    log.success();
  } else {
    log.debug(`Action has no ${token}`);
  }
}
