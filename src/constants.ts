/**
 * Represents the Feather icon names.
 */
import type { FeatherIconNames } from 'feather-icons';
/**
 * Represents the icons object from 'feather-icons' library.
 */
import { icons } from 'feather-icons';

/**
 * Represents the sections of the README.
 */
export const README_SECTIONS = [
  'title',
  'branding',
  'description',
  'usage',
  'inputs',
  'outputs',
  'contents',
  'badges',
] as const;

/**
 * Represents a single section of the README.
 */
export type ReadmeSection = (typeof README_SECTIONS)[number];

/**
 * Represents the file name for the configuration file.
 */
export const configFileName = '.ghadocs.json';

/**
 * Enumerates the keys for the configuration options.
 */
export enum ConfigKeys {
  Owner = 'owner',
  Repo = 'repo',
  TitlePrefix = 'title_prefix',
  Prettier = 'prettier',
  Save = 'save',
  pathsAction = 'paths:action',
  pathsReadme = 'paths:readme',
  BrandingSvgPath = 'branding_svg_path',
  BrandingAsTitlePrefix = 'branding_as_title_prefix',
  VersioningEnabled = 'versioning:enabled',
  VersioningOverride = 'versioning:override',
  VersioningPrefix = 'versioning:prefix',
  VersioningBranch = 'versioning:branch',
  IncludeGithubVersionBadge = 'versioning:badge',
  DebugNconf = 'debug:nconf',
  DebugReadme = 'debug:readme',
  DebugConfig = 'debug:config',
  DebugAction = 'debug:action',
  DebugGithub = 'debug:github',
}

/**
 * Represents the required inputs for the action.
 */
export const RequiredInputs = [
  ConfigKeys.pathsAction,
  ConfigKeys.pathsReadme,
  ConfigKeys.Owner,
  ConfigKeys.Repo,
] as const;

/**
 * Represents the edge length (in pixels) for the branding square.
 */
export const brandingSquareEdgeLengthInPixels = 50;

/**
 * Represents the default brand color.
 */
export const DEFAULT_BRAND_COLOR = 'blue';

/**
 * Represents the default brand icon.
 */
export const DEFAULT_BRAND_ICON = 'activity';

/**
 * Represents the markup for center alignment.
 */
export const ALIGNMENT_MARKUP = '<div align="center">';

/**
 * Represents the set of icons that are omitted in GitHub Actions branding.
 */
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

/**
 * Represents the set of icons available for GitHub Actions branding.
 */
export const GITHUB_ACTIONS_BRANDING_ICONS = new Set(
  Object.keys(icons).filter((item) => !GITHUB_ACTIONS_OMITTED_ICONS.has(item)),
);

/**
 * Represents the available colors for GitHub Actions branding.
 */
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

/**
 * Represents the available brand colors.
 */
export type BrandColors = (typeof GITHUB_ACTIONS_BRANDING_COLORS)[number];

/**
 * Checks if the given icon is valid for GitHub Actions branding.
 * @param {Partial<FeatherIconNames>} icon - The icon to validate.
 * @returns A boolean indicating if the icon is valid.
 */
export function isValidIcon(icon: Partial<FeatherIconNames>): icon is FeatherIconNames {
  return GITHUB_ACTIONS_BRANDING_ICONS.has(icon);
}

/**
 * Checks if the given color is valid for GitHub Actions branding.
 * @param {Partial<BrandColors>} color - The color to validate.
 * @returns A boolean indicating if the color is valid.
 */
export function isValidColor(color: Partial<BrandColors>): color is BrandColors {
  return GITHUB_ACTIONS_BRANDING_COLORS.includes(color);
}

/**
 * Represents the branding information for the action.
 */
export interface Branding {
  /** Color for the action branding */
  color: Partial<BrandColors>;
  icon: Partial<FeatherIconNames>;
}
