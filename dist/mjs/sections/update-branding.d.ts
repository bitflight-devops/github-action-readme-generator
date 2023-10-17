import type Inputs from '../inputs.js';
export interface IBranding {
    alt: string;
    img: string;
    url?: string;
}
export default function updateBranding(token: string, inputs: Inputs): void;
