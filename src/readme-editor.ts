/**
 * This TypeScript code imports the necessary modules and defines a class named `ReadmeEditor`.
 * The class represents an editor for modifying a README file.
 * It has methods to update specific sections within the file and dump the modified content back to the file.
 */

import * as fs from 'node:fs';
import { EOL } from 'node:os';

import { indexOfRegex, lastIndexOfRegex } from './helpers.js';
import LogTask from './logtask/index.js';
import { formatMarkdown } from './prettier.js';

/**
 * The format for the start token of a section.
 */

export const startTokenFormat = '(^|[^`\\\\])<!--\\s+start\\s+%s\\s+-->';

/**
 * The format for the end token of a section.
 */
export const endTokenFormat = '(^|[^`\\\\])<!--\\s+end\\s+%s\\s+-->';

export default class ReadmeEditor {
  private log = new LogTask('ReadmeEditor');

  /**
   * The path to the README file.
   */
  private readonly filePath: string;

  private fileContent: string;

  /**
   * Creates a new instance of `ReadmeEditor`.
   * @param {string} filePath - The path to the README file.
   */
  constructor(filePath: string) {
    this.filePath = filePath;
    try {
      fs.accessSync(filePath);
      this.fileContent = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      this.log.fail(`Readme at '${filePath}' does not exist.`);
      throw error;
    }
  }

  /**
   * Gets the indexes of the start and end tokens for a given section.
   * @param {string} token - The section token.
   * @returns {number[]} - The indexes of the start and end tokens.
   */
  getTokenIndexes(token: string, logTask?: LogTask): number[] {
    const log = logTask ?? new LogTask('getTokenIndexes');
    const startRegExp = new RegExp(startTokenFormat.replace('%s', token));
    const stopRegExp = new RegExp(endTokenFormat.replace('%s', token));
    const startIndex = lastIndexOfRegex(this.fileContent, startRegExp);
    if (startIndex === -1) {
      log.debug(`No start token found for section '${token}'. Skipping`);
      return [];
    }

    const stopIndex = indexOfRegex(this.fileContent, stopRegExp);
    if (stopIndex === -1) {
      log.debug(`No start or end token found for section '${token}'. Skipping`);
      return [];
    }

    return [startIndex, stopIndex];
  }

  /**
   * Updates a specific section in the README file with the provided content.
   * @param {string} name - The name of the section.
   * @param {string | string[]} providedContent - The content to update the section with.
   * @param {boolean} addNewlines - Whether to add newlines before and after the content.
   */
  updateSection(name: string, providedContent: string | string[], addNewlines = true): void {
    const log = new LogTask(name);
    const content = (
      Array.isArray(providedContent) ? providedContent.join(EOL) : providedContent ?? ''
    ).trim();
    log.info(`Looking for the ${name} token in ${this.filePath}`);

    const [startIndex, stopIndex] = this.getTokenIndexes(name, log);
    if (startIndex && stopIndex) {
      const beforeContent = this.fileContent.slice(0, startIndex);
      const afterContent = this.fileContent.slice(stopIndex);

      this.fileContent = addNewlines
        ? `${beforeContent}\n\n${content}\n${afterContent}`
        : `${beforeContent}${content}${afterContent}`;
    }
  }

  /**
   * Dumps the modified content back to the README file.
   * @returns {Promise<void>}
   */
  async dumpToFile(): Promise<void> {
    const content = await formatMarkdown(this.fileContent);
    return fs.promises.writeFile(this.filePath, content, 'utf8');
  }
}
