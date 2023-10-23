import * as feather from 'feather-icons';
import type { Branding } from '../Action.js';
import type Inputs from '../inputs.js';
type FeatherIconKeysArray = keyof typeof feather.icons;
export interface IBranding {
    alt: string;
    img: string;
    url?: string;
}
export declare function getValidIconName(brand?: Branding): FeatherIconKeysArray;
export declare function generateImgMarkup(inputs: Inputs, width?: string): string;
export default function updateBranding(token: string, inputs: Inputs): void;
export {};
