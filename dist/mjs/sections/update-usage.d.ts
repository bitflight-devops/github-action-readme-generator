import { ReadmeSection } from '../constants.js';
import type Inputs from '../inputs.js';
export default function updateUsage(sectionToken: ReadmeSection, inputs: Inputs): Promise<Record<string, string>>;
