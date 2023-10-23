import * as fs from 'node:fs';
import { EOL } from 'node:os';

import LogTask from './logtask/index.js';
import { formatMarkdown } from './prettier.js';

export const startTokenFormat = '<!-- start %s -->';
export const endTokenFormat = '<!-- end %s -->';

export default class ReadmeEditor {
  private readonly filePath: string;

  private fileContent: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.fileContent = fs.readFileSync(filePath, 'utf8');
  }

  getTokenIndexes(token: string): number[] {
    const startToken = startTokenFormat.replace('%s', token);
    const stopToken = endTokenFormat.replace('%s', token);
    const startIndex = Math.max(0, this.fileContent.indexOf(startToken) + startToken.length);
    const stopIndex = this.fileContent.indexOf(stopToken);
    return [startIndex, stopIndex];
  }

  updateSection(name: string, providedContent: string | string[], addNewlines = true): void {
    const log = new LogTask(name);
    const content = (
      Array.isArray(providedContent) ? providedContent.join(EOL) : providedContent ?? ''
    ).trim();
    log.info(`Looking for the ${name} token in ${this.filePath}`);

    const [startIndex, stopIndex] = this.getTokenIndexes(name);

    if (startIndex !== -1 && stopIndex !== -1) {
      const beforeContent = this.fileContent.slice(0, startIndex);
      const afterContent = this.fileContent.slice(stopIndex);

      this.fileContent = addNewlines
        ? `${beforeContent}\n${content}\n${afterContent}`
        : `${beforeContent}${content}${afterContent}`;
    } else if (stopIndex < startIndex && name !== 'branding') {
      throw new Error(`Start token for section '${name}' must appear before end token`);
    }
  }

  async dumpToFile(): Promise<void> {
    const content = await formatMarkdown(this.fileContent);
    return fs.writeFileSync(this.filePath, content, 'utf8');
  }
}
