/**
 * This TypeScript code exports a function named 'updateTitle' which takes a token (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the title section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes, the 'generateImgMarkup' function from './update-branding.js' for generating image markup.
 * @param {ReadmeSection} token - The token representing the section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 */
import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
export default function updateTitle(token: ReadmeSection, inputs: Inputs): void;
