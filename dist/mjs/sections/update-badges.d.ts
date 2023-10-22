import type Inputs from '../inputs.js';
export interface IBadge {
    alt: string;
    img: string;
    url?: string;
}
export default function updateBadges(token: string, inputs: Inputs): void;
