import type { FeatherIconNames } from 'feather-icons';
import type { Branding } from '../Action.js';
import type Inputs from '../inputs.js';
export interface IBranding {
    alt: string;
    img: string;
    url?: string;
}
/**
 * Generates a svg branding image.
 * example:
 * ```ts
 * generateSvgImage('/path/to/file.svg', 'home', 'red')
 * ```
 *
 * @param svgPath - The path to where the svg file will be saved
 * @param icon - The icon name from the feather-icons list
 * @param bgcolor - The background color of the circle behind the icon
 */
export declare function generateSvgImage<T extends Partial<FeatherIconNames>>(svgPath: string, icon: T, bgcolor: string): void;
/**
 * This function returns a valid icon name based on the provided branding.
 * If the branding is undefined or not a valid icon name, an error is thrown.
 * It checks if the branding icon is present in the GITHUB_ACTIONS_BRANDING_ICONS set,
 * and if so, returns the corresponding feather icon key array.
 * If the branding icon is present in the GITHUB_ACTIONS_OMITTED_ICONS set,
 * an error is thrown specifying that the icon is part of the omitted icons list.
 * If the branding icon is not a valid icon from the feather-icons list, an error is thrown.
 * @param brand - The branding object
 * @returns The corresponding feather icon key array
 * @throws Error if the branding icon is undefined, not a valid icon name, or part of the omitted icons list
 */
export declare function getValidIconName(brand?: Branding): FeatherIconNames;
/**
 * This function generates an HTML image markup with branding information.
 * It takes inputs and an optional width parameter.
 * If the branding_svg_path is provided, it generates an action.yml branding image for the specified icon and color.
 * Otherwise, it returns an error message.
 *
 * @param inputs - The inputs instance with data for the function.
 * @param width - The width of the image (default is '15%').
 * @returns The HTML image markup with branding information or an error message.
 */
export declare function generateImgMarkup(inputs: Inputs, width?: string): string;
/**
 * This is a TypeScript function named "updateBranding" that takes in a token string and an object of inputs.
 * It exports the function as the default export.
 * The function logs the brand details from the inputs, starts a log task, generates image markup,
 * updates a section in the readme editor using the token and content, and logs success or failure messages.
 *
 * @param token - The token string that is used to identify the section in the readme editor.
 * @param inputs - The inputs object that contains data for the function.
 */
export default function updateBranding(token: string, inputs: Inputs): void;
