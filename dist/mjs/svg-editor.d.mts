import type { Container } from '@svgdotjs/svg.js';
import type { FeatherIconNames } from 'feather-icons';
import { SVGDocument, SVGWindow } from 'svgdom';
import LogTask from './logtask/index.js';
export default class SVGEditor {
    log: LogTask;
    window?: SVGWindow;
    canvas?: Container;
    document?: SVGDocument;
    constructor();
    init(): Promise<void>;
    /**
     * Generates a svg branding image.
     */
    generateSvgImage(svgPath: string | undefined, icon?: Partial<FeatherIconNames>, bgcolor?: string): void;
}
