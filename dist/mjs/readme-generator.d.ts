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
