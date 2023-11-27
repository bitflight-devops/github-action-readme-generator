/**
 * This TypeScript code imports various modules and defines a function named 'generateDocs'.
 * The function is responsible for generating documentation for the README.md file based on the provided inputs.
 * It iterates through each section defined in the 'inputs.sections' array and calls the 'updateSection' function to update the corresponding section in the README.md file.
 * If an error occurs during the update of a section, it logs the error message and stops the process.
 * Finally, it saves the updated README.md file and calls the 'save' function.
 */

import * as core from '@actions/core';

import { ReadmeSection } from './constants.js';
import Inputs from './inputs.js';
import LogTask from './logtask/index.js';
import updateSection from './sections/index.js';

export type SectionKV = Record<string, string>;
/**
 * Class for managing README generation.
 */
export class ReadmeGenerator {
  /**
   * The Inputs instance.
   */
  private inputs: Inputs;

  /**
   * The Logger instance.
   */
  private log: LogTask;

  /**
   * Initializes the ReadmeGenerator.
   *
   * @param inputs - The Inputs instance
   * @param log - The Logger instance
   */
  constructor(inputs: Inputs, log: LogTask) {
    this.inputs = inputs;
    this.log = log;
  }

  /**
   * Updates the README sections.
   *
   * @param sections - The sections array
   * @returns Promise array of section KV objects
   */
  updateSections(sections: ReadmeSection[]): Promise<SectionKV>[] {
    const promises: Promise<SectionKV>[] = [];

    for (const section of sections) {
      promises.push(updateSection(section, this.inputs));
    }

    return promises;
  }

  /**
   * Resolves the section update promises.
   *
   * @param promises - The promise array
   * @returns Promise resolving to combined sections KV
   */
  async resolveUpdates(promises: Promise<SectionKV>[]): Promise<SectionKV> {
    this.log.debug('Resolving updates');
    const results = await Promise.all(promises);
    const sections: SectionKV = {};

    for (const result of results) {
      Object.assign(sections, result);
    }

    return sections;
  }

  /**
   * Outputs the sections KV to GitHub output.
   *
   * @param sections - The sections KV
   */
  outputSections(sections: SectionKV): void {
    if (process.env.GITHUB_ACTIONS) {
      this.log.debug('Outputting sections');
      core.setOutput('sections', JSON.stringify(sections, null, 2));
    } else {
      this.log.debug('Not outputting sections');
    }
  }

  /**
   * Generates the README documentation.
   *
   * @returns Promise resolving when done
   */
  async generate(providedSections: ReadmeSection[] = this.inputs.sections): Promise<void> {
    const sectionPromises = this.updateSections(providedSections);
    const sections = await this.resolveUpdates(sectionPromises);

    this.outputSections(sections);

    return this.inputs.readmeEditor.dumpToFile();
  }
}
