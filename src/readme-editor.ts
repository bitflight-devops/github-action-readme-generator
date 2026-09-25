/**
 * This TypeScript code imports the necessary modules and defines a class named `ReadmeEditor`.
 * The class represents an editor for modifying a README file.
 * It has methods to update specific sections within the file and dump the modified content back to the file.
 */

import * as fs from 'node:fs';
import { EOL } from 'node:os';

import * as core from '@actions/core';

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

/**
 * What `updateSection` wrote into one section: the trimmed content and the
 * `addNewlines` setting it was laid out under.
 */
interface UpdatedSection {
  content: string;
  addNewlines: boolean;
}

/**
 * Lays out section content the way it sits between its markers.
 * @param {string} content - The trimmed section content.
 * @param {boolean} addNewlines - Whether to pad the content with newlines.
 * @returns {string} - The text that goes between the markers.
 */
function layoutSpan(content: string, addNewlines: boolean): string {
  return addNewlines ? `\n\n${content}\n` : content;
}

export default class ReadmeEditor {
  private log = new LogTask('ReadmeEditor');

  /**
   * The path to the README file.
   */
  private readonly filePath: string;

  private fileContent: string;

  /**
   * The section tokens this editor has replaced, each against the content it
   * wrote and the `addNewlines` it wrote it under. `dumpToFile` formats these
   * spans and nothing else — see `formatUpdatedSections`.
   */
  private readonly updatedSections = new Map<string, UpdatedSection>();

  /**
   * Creates a new instance of `ReadmeEditor`.
   * @param {string} filePath - The path to the README file.
   */
  constructor(filePath: string) {
    this.filePath = filePath;
    try {
      fs.accessSync(filePath);
      this.fileContent = fs.readFileSync(filePath, 'utf8');
      if (process.env.GITHUB_ACTIONS) {
        core.setOutput('readme_before', this.fileContent);
      }
    } catch (error) {
      this.log.fail(`Readme at '${filePath}' does not exist.`);
      throw error;
    }
  }

  /**
   * Gets the current README content.
   * @returns {string} - The README file content.
   */
  getReadmeContent(): string {
    return this.fileContent;
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
  updateSection(
    name: string,
    providedContent: string | string[],
    addNewlines: boolean = true,
  ): void {
    const log = new LogTask(name);
    const content = (
      Array.isArray(providedContent) ? providedContent.join(EOL) : (providedContent ?? '')
    ).trim();
    log.info(`Looking for the ${name} token in ${this.filePath}`);

    const [startIndex, stopIndex] = this.getTokenIndexes(name, log);
    if (startIndex && stopIndex) {
      const beforeContent = this.fileContent.slice(0, startIndex);
      const afterContent = this.fileContent.slice(stopIndex);

      this.fileContent = `${beforeContent}${layoutSpan(content, addNewlines)}${afterContent}`;
      this.updatedSections.set(name, { content, addNewlines });
    }
  }

  /**
   * Formats the span of one section in isolation and splices it back.
   *
   * The content is formatted on its own and reassembled with the same
   * surrounding newlines `updateSection` wrote, so the markers and every byte
   * outside them survive untouched.
   *
   * The span is formatted only while its markers still bound exactly the text
   * `updateSection` wrote. The markers are paired again here, after every
   * section has been written, and a marker another section wrote can win that
   * pairing; the text between such a pair is not this tool's to format.
   * @param {string} name - The name of the section.
   * @param {UpdatedSection} section - What `updateSection` wrote. Formatting
   *   has to reassemble the span the way `updateSection` did, or it hands back
   *   a layout the caller asked not to have.
   */
  private async formatSection(name: string, section: UpdatedSection): Promise<void> {
    const { content, addNewlines } = section;
    const [startIndex, stopIndex] = this.getTokenIndexes(name);
    if (!startIndex || !stopIndex) {
      return;
    }

    if (
      startIndex > stopIndex ||
      this.fileContent.slice(startIndex, stopIndex) !== layoutSpan(content, addNewlines)
    ) {
      this.log.warn(
        `The '${name}' markers no longer bound the text written to them. Leaving the section unformatted`,
      );
      return;
    }

    const formatted = content === '' ? '' : (await formatMarkdown(content)).trim();
    let span = formatted;
    if (addNewlines) {
      span = formatted === '' ? '\n' : layoutSpan(formatted, addNewlines);
    }

    this.fileContent = `${this.fileContent.slice(0, startIndex)}${span}${this.fileContent.slice(
      stopIndex,
    )}`;
  }

  /**
   * Formats every span this editor replaced, one span at a time.
   *
   * Each span is located again before it is formatted, because formatting the
   * previous one moves the indexes of the spans after it. A formatted span no
   * longer holds the text `updateSection` wrote, so it is forgotten once
   * formatted.
   * @returns {Promise<void>}
   */
  private async formatUpdatedSections(): Promise<void> {
    for (const [name, section] of this.updatedSections) {
      await this.formatSection(name, section);
    }
    this.updatedSections.clear();
  }

  /**
   * Dumps the modified content back to the README file.
   * @param {boolean} [prettier=true] - Run the replaced spans through prettier
   *   before writing. Callers pass the resolved `pretty` input; it defaults to
   *   true so constructing a ReadmeEditor directly keeps the formatting
   *   behaviour. Text outside the markers is never formatted, whatever this
   *   flag says — see `docs/tool-contract.md`.
   * @returns {Promise<void>}
   */
  async dumpToFile(prettier: boolean = true): Promise<void> {
    if (prettier) {
      await this.formatUpdatedSections();
    }
    const content = this.fileContent;
    if (process.env.GITHUB_ACTIONS) {
      core.setOutput('readme_after', content);
    }
    return fs.promises.writeFile(this.filePath, content, 'utf8');
  }
}
