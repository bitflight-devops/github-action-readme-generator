/**
 * This TypeScript code imports various modules and defines a function named 'generateDocs'.
 * The function is responsible for generating documentation for the README.md file based on the provided inputs.
 * It iterates through each section defined in the 'inputs.sections' array and calls the 'updateSection' function to update the corresponding section in the README.md file.
 * If an error occurs during the update of a section, it logs the error message and stops the process.
 * Finally, it saves the updated README.md file and calls the 'save' function.
 */
import Inputs from './inputs.js';
export declare const inputs: Inputs;
/**
 * Generates documentation for the README.md file.
 * @returns {Promise<void>} A promise that resolves once the documentation is generated.
 */
export declare function generateDocs(): Promise<void>;
