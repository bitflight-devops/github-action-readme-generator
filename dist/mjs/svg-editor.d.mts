/**
 * This TypeScript code imports necessary modules and defines a class named 'SVGEditor' for generating SVG images.
 * The class has methods for initializing the SVG window, generating SVG content, and writing SVG files.
 * It utilizes various packages such as 'fs', 'path', '@svgdotjs/svg.js', 'feather-icons', and 'svgdom' for SVG manipulation and file operations.
 * The class also defines interfaces for badges and brand colors.
 */
import type { FeatherIconNames } from 'feather-icons';
import type { BrandColors } from './constants.js';
/**
 * Utility class for generating SVG images.
 */
export default class SVGEditor {
    private log;
    private window?;
    private canvas?;
    private document?;
    /**
     * Initializes a new SVGEditor instance.
     */
    constructor();
    /**
     * Initializes the SVG window, document, and canvas if not already set up.
     */
    initSVG(): Promise<void>;
    /**
     * Generates a branded SVG image.
     * @param {string | undefined} svgPath - Path to write the generated SVG file to.
     * @param {Partial<FeatherIconNames>} icon - Name of the icon to use.
     * @param {Partial<BrandColors>} bgcolor - Background color for the image.
     * @returns {Promise<void>} A promise that resolves when the image is generated.
     */
    generateSvgImage(svgPath: string | undefined, icon?: Partial<FeatherIconNames>, bgcolor?: Partial<BrandColors>): Promise<void>;
    /**
     * Writes the SVG xml to disk.
     * @param {string} svgPath - File path to save the SVG to.
     * @param {string} svgContent - The XML for the SVG file.
     */
    writeSVGFile(svgPath: string, svgContent: string): void;
    /**
     * Generates the SVG content for the branding image.
     * @param {FeatherIconNames} icon - Name of the icon to use.
     * @param {BrandColors} color - Background color for the image.
     * @param {number} outerViewBox - Size of the canvas for the image.
     * @returns {string} The generated SVG content.
     */
    generateSVGContent(icon: FeatherIconNames, color: BrandColors, outerViewBox?: number): string;
}
