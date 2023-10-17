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

  updateSection(name: string, providedContent: string | string[]): void {
    const log = new LogTask(name);
    const content = Array.isArray(providedContent) ? providedContent.join(EOL) : providedContent;
    log.info(`Looking for the ${name} token in ${this.filePath}`);
    const startToken = startTokenFormat.replace('%s', name);
    const stopToken = endTokenFormat.replace('%s', name);

    const startIndex = this.fileContent.indexOf(startToken);
    const stopIndex = this.fileContent.indexOf(stopToken);

    if (startIndex !== -1 && stopIndex !== -1) {
      const beforeContent = this.fileContent.slice(0, Math.max(0, startIndex + startToken.length));
      const afterContent = this.fileContent.slice(stopIndex);

      this.fileContent = `${beforeContent}\n${content}\n${afterContent}`;
    } else if (stopIndex < startIndex) {
      throw new Error(`Start token for section '${name} must appear before end token`);
    }
  }

  async dumpToFile(): Promise<void> {
    const content = await formatMarkdown(this.fileContent);
    return fs.writeFileSync(this.filePath, content, 'utf8');
  }
}
