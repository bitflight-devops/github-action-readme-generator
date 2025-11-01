/**
 * This TypeScript code imports various modules and defines a function named 'generateDocs'.
 * The function is responsible for generating documentation for the README.md file based on the provided inputs.
 * It iterates through each section defined in the 'inputs.sections' array and calls the 'updateSection' function to update the corresponding section in the README.md file.
 * If an error occurs during the update of a section, it logs the error message and stops the process.
 * Finally, it saves the updated README.md file and calls the 'save' function.
 */
import { ReadmeSection } from './constants.js';
import Inputs from './inputs.js';
import LogTask from './logtask/index.js';
export type SectionKV = Record<string, string>;
/**
 * Class for managing README generation.
 */
export declare class ReadmeGenerator {
    /**
     * The Inputs instance.
     */
    private inputs;
    /**
     * The Logger instance.
     */
    private log;
    /**
     * Initializes the ReadmeGenerator.
     *
     * @param inputs - The Inputs instance
     * @param log - The Logger instance
     */
    constructor(inputs: Inputs, log: LogTask);
    /**
     * Updates the README sections.
     *
     * @param sections - The sections array
     * @returns Promise array of section KV objects
     */
    updateSections(sections: ReadmeSection[]): Promise<SectionKV>[];
    /**
     * Resolves the section update promises.
     *
     * @param promises - The promise array
     * @returns Promise resolving to combined sections KV
     */
    resolveUpdates(promises: Promise<SectionKV>[]): Promise<SectionKV>;
    /**
     * Outputs the sections KV to GitHub output.
     *
     * @param sections - The sections KV
     */
    outputSections(sections: SectionKV): void;
    /**
     * Generates the README documentation.
     *
     * @returns Promise resolving when done
     */
    generate(providedSections?: ReadmeSection[]): Promise<void>;
}
