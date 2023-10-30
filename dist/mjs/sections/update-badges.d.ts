/**
 * This TypeScript code imports necessary modules and defines a function named 'updateBadges' which takes a token (ReadmeSection) and an instance of the 'Inputs' class as its parameters.
 * The function is responsible for updating the badges section in the README.md file based on the provided inputs.
 * It utilizes the 'LogTask' class for logging purposes.
 */
import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
/**
 * Interface for a badge.
 */
export interface IBadge {
    alt: string;
    img: string;
    url?: string;
}
export default function updateBadges(token: ReadmeSection, inputs: Inputs): void;
