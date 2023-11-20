/**
 * This TypeScript code exports a function named 'updateInputs' which takes a sectionToken (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the inputs section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes, 'columnHeader' and 'rowHeader' functions from '../helpers.js' for formatting table headers, and 'markdowner' function from '../markdowner/index.js' for generating markdown content.
 * @param {ReadmeSection} sectionToken - The sectionToken representing the section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
export default function updateInputs(sectionToken: ReadmeSection, inputs: Inputs): Record<string, string>;
