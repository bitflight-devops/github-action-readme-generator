import type Inputs from '../inputs';
import LogTask from '../logtask';

export default function updateDescription(token: string, inputs: Inputs): void {
  const log = new LogTask(token);
  // Build the new README
  const content: string[] = [];
  // Build the new description section
  if (inputs?.action?.description) {
    log.start();
    const desc: string = inputs.action.description
      .trim()
      .replaceAll('\r\n', '\n') // Convert CR to LF
      .replaceAll(/ +/g, ' ') //    Squash consecutive spaces
      .replaceAll(' \n', '\n') //  Squash space followed by newline
      .replaceAll('\n\n', '<br />'); // convert double return to a break

    log.info(`Writing ${desc.length} characters to the description section`);
    content.push(desc);
    inputs.readmeEditor.updateSection(token, content);
    log.success();
  }
}
