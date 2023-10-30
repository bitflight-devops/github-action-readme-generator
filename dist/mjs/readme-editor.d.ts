/**
 * This TypeScript code imports the necessary modules and defines a class named `ReadmeEditor`.
 * The class represents an editor for modifying a README file.
 * It has methods to update specific sections within the file and dump the modified content back to the file.
 */
/**
 * The format for the start token of a section.
 */
export declare const startTokenFormat = "<!-- start %s -->";
/**
 * The format for the end token of a section.
 */
export declare const endTokenFormat = "<!-- end %s -->";
export default class ReadmeEditor {
    private log;
    /**
     * The path to the README file.
     */
    private readonly filePath;
    private fileContent;
    /**
     * Creates a new instance of `ReadmeEditor`.
     * @param {string} filePath - The path to the README file.
     */
    constructor(filePath: string);
    /**
     * Gets the indexes of the start and end tokens for a given section.
     * @param {string} token - The section token.
     * @returns {number[]} - The indexes of the start and end tokens.
     */
    getTokenIndexes(token: string): number[];
    /**
     * Updates a specific section in the README file with the provided content.
     * @param {string} name - The name of the section.
     * @param {string | string[]} providedContent - The content to update the section with.
     * @param {boolean} addNewlines - Whether to add newlines before and after the content.
     */
    updateSection(name: string, providedContent: string | string[], addNewlines?: boolean): void;
    /**
     * Dumps the modified content back to the README file.
     * @returns {Promise<void>}
     */
    dumpToFile(): Promise<void>;
}
