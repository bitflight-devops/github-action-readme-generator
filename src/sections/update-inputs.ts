import { columnHeader, rowHeader } from '../helpers';
import type Inputs from '../inputs';
import LogTask from '../logtask';
import markdowner from '../markdowner';

export default function updateInputs(token: string, inputs: Inputs): void {
  const log = new LogTask(token);
  // Build the new README
  const content: string[] = [];
  const markdownArray: string[][] = [];
  const titleArray = ['Input', 'Description', 'Default', 'Required'];
  const titles: string[] = [];
  for (const t of titleArray) {
    titles.push(columnHeader(t));
  }
  markdownArray.push(titles);
  const vars = inputs.action.inputs;
  const tI = vars ? Object.keys(vars).length : 0;
  if (tI > 0) {
    log.start();
    for (const key of Object.keys(vars)) {
      const values = vars[key];

      let description = values?.description ?? '';

      // Check if only first line should be added (only subject without body)
      // eslint-disable-next-line no-useless-escape
      const matches = description.match('(.*?)\n\n([Ss]*)');
      if (matches && matches.length >= 2) {
        description = matches[1] || description;
      }

      description = description.trim().replace('\n', '<br />');

      const row: string[] = [
        rowHeader(key),
        description,
        values?.default ? `\`${values.default}\`` : '',
        values?.required ? '**true**' : '__false__',
      ];
      log.debug(JSON.stringify(row));
      markdownArray.push(row);
    }
    content.push(markdowner(markdownArray));
    log.info(`Action has ${tI} total ${token}`);
    inputs.readmeEditor.updateSection(token, content);
    log.success();
  } else {
    log.debug(`Action has no ${token}`);
  }
}
