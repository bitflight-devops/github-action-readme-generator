/* eslint-disable import/no-extraneous-dependencies */
import * as feather from 'feather-icons';

import type { Branding } from '../Action.js';
import type Inputs from '../inputs.js';
import LogTask from '../logtask/index.js';
import SVGEditor, { GITHUB_ACTIONS_BRANDING_ICONS } from '../svg-editor.mjs';

/**
 * Wiith thanks to
 * https://github.com/haya14busa/github-action-brandings/blob/master/main.js
 * for the urls to the branding images.
 */
type conforms<T, V> = T extends V ? T : V;
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
function generateSvgImage(
  svgPath: string,
  icon: FeatherIconKeys<keyof typeof feather.icons>,
  bgcolor: string,
): void {
  const svgEditor = new SVGEditor();
  svgEditor.generateSvgImage(svgPath, icon, bgcolor);
  //   const svgOut = [
  //     '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
  //     draw.svg(),
  //     '\n',
  //   ].join('\n');
  //   log.info(`SVG data to write: ${svgOut}`);
  //   fs.mkdirSync(path.dirname(svgPath), { recursive: true });
  //   fs.writeFileSync(svgPath, svgOut, { encoding: 'utf8' });
  // } catch (error) {
  //   log.error(`Error generating svg image: ${svgPath}. Error: ${error}`);
  // }
}
function generateImgMarkup(svgPath: string, brand: Branding): string {
  return `<img src="${svgPath}" alt="${brand.icon ?? ''}" />`;
}
export default function updateBranding(token: string, inputs: Inputs): void {
  const log = new LogTask(token);
  const svgPath = inputs.config.get('github_action_branding_svg_path') as string;

  log.info(`Brand details: ${JSON.stringify(inputs.action.branding)}`);

  const brand: Branding = inputs.action.branding;

  log.start();
  if (typeof brand.icon === 'string' && GITHUB_ACTIONS_BRANDING_ICONS.has(brand.icon)) {
    const iconName = featherType(brand.icon);
    log.info(`Generating action.yml branding image for ${iconName}`);

    generateSvgImage(svgPath, iconName, brand.color);
    const content = generateImgMarkup(svgPath, brand);
    inputs.readmeEditor.updateSection(token, content);
  } else {
    log.warn('No icon specified for branding in action.yml. Leaving section blank');
    inputs.readmeEditor.updateSection(token, '');
  }
  log.success();
}
