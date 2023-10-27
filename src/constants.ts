import type { FeatherIconNames } from 'feather-icons';
import { icons } from 'feather-icons';

export const brandingSquareEdgeLengthInPixels = 50;
export const DEFAULT_BRAND_COLOR = 'blue';
export const DEFAULT_BRAND_ICON = 'activity';
export const ALIGNMENT_MARKUP = '<div align="center">';

// https://help.github.com/en/articles/metadata-syntax-for-github-actions#branding
export const GITHUB_ACTIONS_OMITTED_ICONS = new Set([
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
  Object.keys(icons).filter((item) => !GITHUB_ACTIONS_OMITTED_ICONS.has(item)),
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
] as const;

export type BrandColors = (typeof GITHUB_ACTIONS_BRANDING_COLORS)[number];

export function isValidIcon(icon: Partial<FeatherIconNames>): icon is FeatherIconNames {
  return GITHUB_ACTIONS_BRANDING_ICONS.has(icon);
}
export function isValidColor(color: Partial<BrandColors>): color is BrandColors {
  return GITHUB_ACTIONS_BRANDING_COLORS.includes(color);
}

/**
 * Branding information for the action.
 */
export interface Branding {
  /** Color for the action branding */
  color: Partial<BrandColors>;
  icon: Partial<FeatherIconNames>;
}
