/**
 * This TypeScript code exports a function named 'updateSection' which takes a section (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating different sections of the README.md file based on the provided section input.
 * It utilizes various update functions (e.g., updateBranding, updateBadges) to update specific sections.
 * @param {ReadmeSection} section - The section of the README to update.
 * @param {Inputs} inputs - The Inputs class instance.
 * @returns {Promise<void>} A promise that resolves once the section is updated.
 */
import type Inputs from '../inputs.js';
export declare const README_SECTIONS: readonly ["title", "branding", "description", "usage", "inputs", "outputs", "contents", "badges"];
export type ReadmeSection = (typeof README_SECTIONS)[number];
export default function updateSection(section: ReadmeSection, inputs: Inputs): Promise<void>;
