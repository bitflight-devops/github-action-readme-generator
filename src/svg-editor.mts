/**
 * This TypeScript code imports necessary modules and defines a class named 'SVGEditor' for generating SVG images.
 * The class has methods for initializing the SVG window, generating SVG content, and writing SVG files.
 * It utilizes various packages such as 'fs', 'path', '@svgdotjs/svg.js', 'feather-icons', and 'svgdom' for SVG manipulation and file operations.
 * The class also defines interfaces for badges and brand colors.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Container } from '@svgdotjs/svg.js';
import { registerWindow, SVG } from '@svgdotjs/svg.js';
import type { FeatherIconNames } from 'feather-icons';
import * as feather from 'feather-icons';
import { createSVGWindow, SVGDocument, SVGWindow } from 'svgdom'; /// main-module.js';

import type { BrandColors } from './constants.js';
import {
  brandingSquareEdgeLengthInPixels,
  DEFAULT_BRAND_COLOR,
  DEFAULT_BRAND_ICON,
  GITHUB_ACTIONS_BRANDING_COLORS,
  GITHUB_ACTIONS_BRANDING_ICONS,
  isValidColor,
  isValidIcon,
} from './constants.js';
import LogTask from './logtask/index.js';

/**
 * Utility class for generating SVG images.
 */
/* eslint-disable import/no-extraneous-dependencies */
export default class SVGEditor {
  private log: LogTask;

  private window?: SVGWindow;

  private canvas?: Container;

  private document?: SVGDocument;

  /**
   * Initializes a new SVGEditor instance.
   */
  constructor() {
    this.log = new LogTask('SVGEditor');
  }

  /**
   * Initializes the SVG window, document, and canvas if not already set up.
   */
  async initSVG(): Promise<void> {
    if (!this.window) {
      this.window = createSVGWindow();
      const { document } = this.window;
      registerWindow(this.window, document);
      if (!this.canvas) {
        this.canvas = SVG(document.documentElement) as Container;
      }
    }
  }

  /**
   * Generates a branded SVG image.
   * @param {string | undefined} svgPath - Path to write the generated SVG file to.
   * @param {Partial<FeatherIconNames>} icon - Name of the icon to use.
   * @param {Partial<BrandColors>} bgcolor - Background color for the image.
   * @returns {Promise<void>} A promise that resolves when the image is generated.
   */
  async generateSvgImage(
    svgPath: string | undefined,
    icon: Partial<FeatherIconNames> = DEFAULT_BRAND_ICON,
    bgcolor: Partial<BrandColors> = DEFAULT_BRAND_COLOR
  ): Promise<void> {
    if (!svgPath || svgPath.length === 0) {
      this.log.debug('No svgPath provided');
      return;
    }

    if (!isValidIcon(icon)) {
      this.log.error(`Valid Branding Icon Names: ${GITHUB_ACTIONS_BRANDING_ICONS}`);
      this.log.fail(`Invalid icon name: ${icon}`);
      return;
    }
    if (!isValidColor(bgcolor)) {
      this.log.error(`Valid Branding Colors: ${GITHUB_ACTIONS_BRANDING_COLORS}`);
      this.log.fail('Invalid branding color');
      return;
    }
    this.log.info(`SVG to generate ${icon} at ${svgPath} with color ${bgcolor}.`);
    // Initialize SVG
    await this.initSVG();
    // Generate SVG content
    const svgContent = this.generateSVGContent(icon, bgcolor);

    // Write SVG file
    this.writeSVGFile(svgPath, svgContent);

    this.log.debug('SVG image generated successfully');
  }

  /**
   * Writes the SVG xml to disk.
   * @param {string} svgPath - File path to save the SVG to.
   * @param {string} svgContent - The XML for the SVG file.
   */
  writeSVGFile(svgPath: string, svgContent: string): void {
    fs.mkdirSync(path.dirname(svgPath), { recursive: true });
    this.log.debug(`Writing SVG file to ${svgPath}`);
    fs.writeFile(svgPath, svgContent, 'utf8', () => {
      return this.log.debug(`SVG image generated: ${svgPath}`);
    });
  }

  /**
   * Generates the SVG content for the branding image.
   * @param {FeatherIconNames} icon - Name of the icon to use.
   * @param {BrandColors} color - Background color for the image.
   * @param {number} outerViewBox - Size of the canvas for the image.
   * @returns {string} The generated SVG content.
   */
  generateSVGContent(icon: FeatherIconNames, color: BrandColors, outerViewBox = 100): string {
    const { canvas, log } = this;
    // Validate canvas
    if (!canvas) {
      log.fail('Canvas not initialized');
      return '';
    }

    const svgData = feather.icons[icon];
    log.debug(`SVG data to ingest: ${svgData.toSvg()}`);

    canvas.clear();

    // Create a canvas that is `outerViewBox` x `outerViewBox`
    canvas
      .size(brandingSquareEdgeLengthInPixels, brandingSquareEdgeLengthInPixels)
      .viewbox(`0 0 ${outerViewBox} ${outerViewBox}`)
      .fill('none');

    // Create a 'color' circle that touches the edges of the canvas
    const circleSize = outerViewBox / 2;
    canvas
      .circle('50%')
      .fill(color)
      .radius(circleSize)
      .cx(circleSize)
      .cy(circleSize)
      .stroke({ width: 0 });

    // Create an svg box that is half the size of the parent
    const iconsvgOuter = canvas.nested();
    iconsvgOuter.attr('overflow', 'visible').height('50%').width('50%').x('25%').y('25%');

    // create a nested svg and add the feather-icon paths to the svg
    const iconsvg = iconsvgOuter.nested();
    iconsvg.id('icon').svg(svgData.contents);

    // Append all of the attributes from the fether-icon
    for (const attr of Object.keys(svgData.attrs)) {
      iconsvg.attr(attr, svgData.attrs[attr]);
    }

    // invert the stroke color if it matches the background color
    iconsvg.stroke(color.startsWith('white') ? 'white' : 'black');

    // remove the edge clipping
    iconsvg.attr('overflow', 'visible');

    // Make the viewbox of the svg match the exact dimensions of the icon
    iconsvg.viewbox(iconsvg.bbox());

    // Make the svg icon center itself vertically and horozonally
    iconsvg.height('auto').width('auto');

    // return the xml file content
    return ['<?xml version="1.0" encoding="UTF-8" standalone="no"?>', canvas.svg(), '\n'].join(
      '\n'
    );
  }
}
