/* eslint-disable import/no-extraneous-dependencies */
import * as feather from 'feather-icons';

import type { Branding } from '../Action.js';
import {
  DEFAULT_BRAND_COLOR,
  GITHUB_ACTIONS_BRANDING_ICONS,
  GITHUB_ACTIONS_OMITTED_ICONS,
} from '../constants.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';
import SVGEditor from '../svg-editor.mjs';

/**
 * Wiith thanks to
 * https://github.com/haya14busa/github-action-brandings/blob/master/main.js
 * for the urls to the branding images.
 */
type conforms<T, V> = T extends V ? T : V;
type Maybe<T> = T | undefined;
type FeatherIconKeysArray = keyof typeof feather.icons;
type FeatherIconKeys<T extends string, R = FeatherIconKeysArray> = conforms<T, R>;
function featherType<T extends FeatherIconKeysArray | string>(iconName: T): FeatherIconKeys<T> {
  return iconName as FeatherIconKeys<T>;
}
export interface IBranding {
  alt: string;
  img: string;
  url?: string;
}

/**
 * Generates a svg branding image.
 */
function generateSvgImage<T extends FeatherIconKeysArray>(
  svgPath: string,
  icon: FeatherIconKeys<T>,
  bgcolor: string,
): void {
  const svgEditor = new SVGEditor();
  svgEditor.generateSvgImage(svgPath, icon, bgcolor);
}

export function getValidIconName(brand?: Branding): FeatherIconKeysArray {
  if (brand && typeof brand.icon === 'string') {
    if (GITHUB_ACTIONS_BRANDING_ICONS.has(brand.icon)) {
      return featherType(brand.icon);
    }
    if (GITHUB_ACTIONS_OMITTED_ICONS.has(brand.icon)) {
      throw new Error(
        `No valid branding icon name found: ${brand.icon} is part of the list of omitted icons. `,
      );
    }
    throw new Error(
      `No valid branding icon name found: ${brand.icon} is not a valid icon from the feather-icons list`,
    );
  }
  throw new Error(`No valid branding icon name found: action.yml branding is undefined`);
}

export function generateImgMarkup(inputs: Inputs, width = '15%'): string {
  const log = new LogTask('generateImgMarkup');

  const brand: Branding = inputs.action.branding;
  const iconName = getValidIconName(brand);
  const color = brand.color ?? DEFAULT_BRAND_COLOR;
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
export default function updateBranding(token: string, inputs: Inputs): void {
  const log = new LogTask(token);

  log.info(`Brand details: ${JSON.stringify(inputs.action.branding)}`);

  log.start();

  const content = generateImgMarkup(inputs);
  inputs.readmeEditor.updateSection(token, content);
  if (content && content !== '') {
    log.success('branding svg successfully created');
  } else {
    log.fail('branding svg failed to be created');
  }
}
