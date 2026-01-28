/**
 * This TypeScript code exports a function named 'updateContents' which generates
 * a table of contents from the README.md headers.
 * @param {ReadmeSection} sectionToken - The sectionToken representing the section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
export default function updateContents(sectionToken: ReadmeSection, inputs: Inputs): Record<string, string>;
