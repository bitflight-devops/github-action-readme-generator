/**
 * This TypeScript code exports a function named 'updateOutputs' which takes a sectionToken (string) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the outputs section in the README.md file based on the provided inputs.
 * It generates a table with three columns: Output name, Description, and Value (for composite actions).
 * It utilizes the 'LogTask' class for logging purposes, 'columnHeader' and 'rowHeader' functions from '../helpers.js' for formatting table headers, and 'markdowner' function from '../markdowner/index.js' for generating markdown content.
 * @param {ReadmeSection} sectionToken - The sectionToken used for identifying the section.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
export default function updateOutputs(sectionToken: ReadmeSection, inputs: Inputs): Record<string, string>;
