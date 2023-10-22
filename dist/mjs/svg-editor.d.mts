import type { Container } from '@svgdotjs/svg.js';
import * as feather from 'feather-icons';
import { SVGDocument, SVGWindow } from 'svgdom';
import LogTask from './logtask/index.js';
type conforms<T, V> = T extends V ? T : V;
type FeatherIconKeysArray = keyof typeof feather.icons;
type FeatherIconKeys<T extends string, R = FeatherIconKeysArray> = conforms<T, R>;
export declare const GITHUB_ACTIONS_BRANDING_ICONS: Set<string>;
export declare const GITHUB_ACTIONS_BRANDING_COLORS: string[];
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
    generateSvgImage(svgPath: string | undefined, icon?: FeatherIconKeys<keyof typeof feather.icons>, bgcolor?: string): void;
}
export {};
