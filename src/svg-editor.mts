/* eslint-disable import/no-extraneous-dependencies */
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Container } from '@svgdotjs/svg.js';
import { registerWindow, SVG } from '@svgdotjs/svg.js';
import * as feather from 'feather-icons';
import { createSVGDocument, createSVGWindow } from 'svgdom'; /// main-module.js';

import LogTask from './logtask/index.js';

type conforms<T, V> = T extends V ? T : V;
type FeatherIconKeysArray = keyof typeof feather.icons;
type FeatherIconKeys<T extends string, R = FeatherIconKeysArray> = conforms<T, R>;
// function featherType<T extends FeatherIconKeysArray | string>(iconName: T): FeatherIconKeys<T> {
//   return iconName as FeatherIconKeys<T>;
// }
const brandingSquareEdgeLengthInPixels = 50;

// https://help.github.com/en/articles/metadata-syntax-for-github-actions#branding
const GITHUB_ACTIONS_OMITTED_ICONS = new Set([
  'coffee',
  'columns',
  'divide-circle',
  'divide-square',
  'divide',
  'frown',
  'hexagon',
  'key',
  'meh',
  'mouse-pointer',
  'smile',
  'tool',
  'x-octagon',
]);
export const GITHUB_ACTIONS_BRANDING_ICONS = new Set(
  Object.keys(feather.icons).filter((item) => !GITHUB_ACTIONS_OMITTED_ICONS.has(item))
);
export const GITHUB_ACTIONS_BRANDING_COLORS = [
  'white',
  'yellow',
  'blue',
  'green',
  'orange',
  'red',
  'purple',
  'gray-dark',
];
export default class SVGEditor {
  log: LogTask;

  window: any;

  canvas: any;

  document: any;

  constructor() {
    this.log = new LogTask('SVGEditor');
  }

  async init(): Promise<void> {
    if (!this.window) {
      // returns a window with a document and an svg root node
      this.window = createSVGWindow();

      const { document } = this.window;
      // instanceof<typeof createSVGWindow>
      // register window and document
      registerWindow(this.window, document);
      if (!this.canvas) {
        // create canvas
        this.canvas = SVG(document.documentElement) as Container;
      }
    }

    if (!this.document) {
      this.document = createSVGDocument();
    }

    if (!this.canvas) {
      // create canvas
      this.canvas = SVG(this.document.documentElement) as Container;
    }
  }

  /**
   * Generates a svg branding image.
   */
  generateSvgImage(
    svgPath = './svg-basic.svg',
    icon: FeatherIconKeys<keyof typeof feather.icons> = 'book-open',
    bgcolor = 'blue'
  ): void {
    this.init()
      .then(() => {
        if (!GITHUB_ACTIONS_BRANDING_ICONS.has(icon)) {
          this.log.fail(`Invalid icon specified for branding: ${icon}`);
          return;
        }
        const color = GITHUB_ACTIONS_BRANDING_COLORS.includes(bgcolor.toLowerCase())
          ? bgcolor.toLowerCase()
          : 'blue';

        const svgData = feather.icons[icon];
        this.log.info(`SVG data generated for ${icon} at ${svgPath} with color ${color}.`);
        this.log.debug(`SVG data to ingest: ${svgData.toSvg()}`);
        if (this.canvas) {
          const canvas: Container = this.canvas as Container;
          canvas.clear();
          for (const attr of Object.keys(svgData.attrs)) {
            canvas.attr(attr, svgData.attrs[attr]);
          }

          canvas
            .size(brandingSquareEdgeLengthInPixels, brandingSquareEdgeLengthInPixels)
            .viewbox(`0 0 ${brandingSquareEdgeLengthInPixels} ${brandingSquareEdgeLengthInPixels}`)
            .stroke(color.startsWith('white') ? 'white' : 'black')
            .fill('none');
          const circleSize = brandingSquareEdgeLengthInPixels / 2;
          const bggroup = canvas.group();
          bggroup
            .id('bg')
            .circle(circleSize)
            .fill(color)
            .radius(circleSize)
            .cx(circleSize)
            .cy(circleSize)
            .stroke({ width: 0 });
          const fggroup = canvas.group();

          fggroup
            .id('fg')
            .size(brandingSquareEdgeLengthInPixels * 0.7, brandingSquareEdgeLengthInPixels * 0.7)
            .svg(svgData.contents);
          const fgheight: number = fggroup.bbox().height;
          const fgwidth: number = fggroup.bbox().width;
          const scale = (brandingSquareEdgeLengthInPixels * 0.5) / Math.max(fgheight, fgwidth);

          this.log.info(`SVG - height: ${fgheight} width: ${fgwidth} scale: ${scale}`);
          fggroup.transform({
            scale,
            translateX: (brandingSquareEdgeLengthInPixels - fgwidth * scale) / 2,
            translateY: (brandingSquareEdgeLengthInPixels - fgheight * scale) / 2,
          });

          const svgOut = [
            '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
            this.canvas.svg(),
            '\n',
          ].join('\n');
          this.log.debug(`SVG data to write: ${svgOut}`);
          fs.mkdirSync(path.dirname(svgPath), { recursive: true });
          fs.writeFileSync(svgPath, svgOut, { encoding: 'utf8' });
          this.log.debug(`SVG image generated: ${svgPath}`);
          return;
        }

        throw new Error('Canvas not initialized');
      })
      .catch((error) => {
        this.log.fail(`Error generating svg image: ${svgPath}. Error: ${error}`);
      });
  }
}
