import type Inputs from '../inputs';
import LogTask from '../logtask';
import updateReadme from '../readme-writer';

export default function updateDescription(token: string, inputs: Inputs): void {
  const log = new LogTask(token);
  // Build the new README
  const content: string[] = [];
  // Build the new description section
  if (inputs?.action?.description) {
    log.start();
    const desc: string = inputs.action.description
      .trim()
      .replace(/\r\n/g, '\n') // Convert CR to LF
      .replace(/ +/g, ' ') //    Squash consecutive spaces
      .replace(/ \n/g, '\n') //  Squash space followed by newline
      .replace('\n\n', '<br />'); // convert double return to a break

    log.info(`Writing ${desc.length} characters to the description section`);
    content.push(desc);
    updateReadme(content, token, inputs.readmePath);
    log.success();
  }
}
