/* eslint-disable import/no-extraneous-dependencies */
import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Container } from '@svgdotjs/svg.js';
import { registerWindow, SVG } from '@svgdotjs/svg.js';
import * as feather from 'feather-icons';
import { createSVGDocument, createSVGWindow, SVGDocument, SVGWindow } from 'svgdom'; /// main-module.js';

import {
  brandingSquareEdgeLengthInPixels,
  GITHUB_ACTIONS_BRANDING_COLORS,
  GITHUB_ACTIONS_BRANDING_ICONS,
} from './constants.js';
import LogTask from './logtask/index.js';

type conforms<T, V> = T extends V ? T : V;
type FeatherIconKeysArray = keyof typeof feather.icons;
type FeatherIconKeys<T extends string, R = FeatherIconKeysArray> = conforms<T, R>;
// function featherType<T extends FeatherIconKeysArray | string>(iconName: T): FeatherIconKeys<T> {
//   return iconName as FeatherIconKeys<T>;
// }

export default class SVGEditor {
  log: LogTask;

  window?: SVGWindow;

  canvas?: Container;

  document?: SVGDocument;

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
    svgPath: string | undefined,
    icon: FeatherIconKeys<keyof typeof feather.icons> = 'book-open',
    bgcolor = 'blue'
  ): void {
    const { log } = this;
    if (svgPath && svgPath.length > 0) {
      fs.mkdirSync(path.dirname(svgPath), { recursive: true });
      this.init()
        .then(() => {
          const { canvas } = this;
          if (!GITHUB_ACTIONS_BRANDING_ICONS.has(icon)) {
            log.fail(`Invalid icon specified for branding: ${icon}`);
            return;
          }
          const color = GITHUB_ACTIONS_BRANDING_COLORS.includes(bgcolor.toLowerCase())
            ? bgcolor.toLowerCase()
            : 'blue';

          const svgData = feather.icons[icon];
          log.info(`SVG data generated for ${icon} at ${svgPath} with color ${color}.`);
          log.debug(`SVG data to ingest: ${svgData.toSvg()}`);
          if (canvas) {
            canvas.clear();
            const outerViewBox = 100;
            canvas
              .size(brandingSquareEdgeLengthInPixels, brandingSquareEdgeLengthInPixels)
              .viewbox(`0 0 ${outerViewBox} ${outerViewBox}`)
              .stroke(color.startsWith('white') ? 'white' : 'black')
              .fill('none');
            const circleSize = outerViewBox / 2;
            canvas
              .circle('50%')
              .fill(color)
              .radius(circleSize)
              .cx(circleSize)
              .cy(circleSize)
              .stroke({ width: 0 });

            const iconsvgOuter = canvas.nested();
            iconsvgOuter.attr('overflow', 'visible').height('50%').width('50%').x('25%').y('25%');
            const iconsvg = iconsvgOuter.nested();

            iconsvg.id('icon').svg(svgData.contents);
            for (const attr of Object.keys(svgData.attrs)) {
              iconsvg.attr(attr, svgData.attrs[attr]);
            }
            iconsvg.attr('overflow', 'visible');
            log.info(`SVG icon: rbox: ${iconsvg.rbox()}`);
            log.info(`SVG icon: bbox: ${iconsvg.bbox()}`);
            iconsvg.viewbox(iconsvg.bbox());
            iconsvg.height('auto').width('auto');

            const svgOut = [
              '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
              canvas.svg(),
              '\n',
            ].join('\n');
            log.debug(`SVG data to write: ${svgOut}`);
            fs.mkdirSync(path.dirname(svgPath), { recursive: true });
            fs.writeFileSync(svgPath, svgOut, { encoding: 'utf8' });
            log.debug(`SVG image generated: ${svgPath}`);
            return;
          }

          throw new Error('Canvas not initialized');
        })
        .catch((error) => {
          log.fail(`Error generating svg image: ${svgPath}. Error: ${error}`);
        });
    } else {
      log.debug('svgPath is not provided');
    }
  }
}
