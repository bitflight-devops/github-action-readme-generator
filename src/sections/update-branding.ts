import type { FeatherIconNames } from 'feather-icons';

import type { BrandColors } from '../constants.js';
import { GITHUB_ACTIONS_OMITTED_ICONS, isValidIcon, ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';
import SVGEditor from '../svg-editor.mjs';
/**
 * Wiith thanks to
 * https://github.com/haya14busa/github-action-brandings/blob/master/main.js
 * for the urls to the branding images.
 */

type Maybe<T> = T | undefined;

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
export function generateSvgImage(
  svgPath: string,
  icon: Partial<FeatherIconNames>,
  bgcolor: Partial<BrandColors>,
): void {
  const svgEditor = new SVGEditor();
  svgEditor.generateSvgImage(svgPath, icon, bgcolor);
}

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
export function getValidIconName(icon?: Partial<FeatherIconNames>): FeatherIconNames {
  if (!icon) {
    throw new Error(`No valid branding icon name found: action.yml branding is undefined`);
  }

  if (isValidIcon(icon)) {
    return icon;
  }

  if (GITHUB_ACTIONS_OMITTED_ICONS.has(icon)) {
    throw new Error(
      `No valid branding icon name found: ${icon} is part of the list of omitted icons. `,
    );
  }

  throw new Error(
    `No valid branding icon name found: ${icon} is not a valid icon from the feather-icons list`,
  );
}

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
export function generateImgMarkup(inputs: Inputs, width = '15%'): string {
  // Create a log task for debugging
  const log = new LogTask('generateImgMarkup');
  if (!inputs.action.branding) {
    log.info('No branding section');
    return '';
  }
  // Get the branding information from the inputs
  const { icon, color } = inputs.action.branding;
  const iconName = getValidIconName(icon);
  const svgPath = inputs.config.get('branding_svg_path') as Maybe<string>;
  const result = `<img src="${svgPath}" width="${width}" align="center" alt="branding<icon:${iconName} color:${color}>" />`;

  if (svgPath) {
    log.info(`Generating action.yml branding image for ${iconName}`);
    const svg = inputs.config.get('image_generated') as Maybe<string>;
    const hash = `${iconName}${color}`;
    if (svg && hash.localeCompare(svg) !== 0) {
      generateSvgImage(svgPath, iconName, color);
      inputs.config.set('image_generated', hash);
    }
    return result;
  }
  log.error(`No branding_svg_path provided or it is empty string, can't create the file!`);
  return `<!-- ERROR: no branding path found = ${result} -->`;
}

/**
 * This is a TypeScript function named "updateBranding" that takes in a sectionToken string and an object of inputs.
 * It exports the function as the default export.
 * The function logs the brand details from the inputs, starts a log task, generates image markup,
 * updates a section in the readme editor using the sectionToken and content, and logs success or failure messages.
 *
 * @param sectionToken - The sectionToken string that is used to identify the section in the readme editor.
 * @param inputs - The inputs object that contains data for the function.
 */
export default function updateBranding(
  sectionToken: ReadmeSection,
  inputs: Inputs,
): Record<string, string> {
  const log = new LogTask(sectionToken);

  log.info(`Brand details: ${JSON.stringify(inputs.action.branding)}`);

  log.start();
  /** create <img  /> markup with an image width of 15% */
  const imageWidth = '15%';
  const content = generateImgMarkup(inputs, imageWidth);
  inputs.readmeEditor.updateSection(sectionToken, content);
  if (content && content !== '') {
    log.success('branding svg successfully created');
  } else {
    log.fail('branding svg failed to be created');
  }

  const ret: Record<string, string> = {};
  ret[sectionToken] = content;
  return ret;
}
