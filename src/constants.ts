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
/**
 * Valid version source options for determining action version.
 */
export const VERSION_SOURCES = [
  'git-tag',
  'git-branch',
  'git-sha',
  'package-json',
  'explicit',
] as const;

/**
 * Type for version source options.
 */
export type VersionSource = (typeof VERSION_SOURCES)[number];

/**
 * Checks if the given value is a valid version source.
 */
export function isValidVersionSource(value: string): value is VersionSource {
  return VERSION_SOURCES.includes(value as VersionSource);
}

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
  VersioningSource = 'versioning:source',
  IncludeGithubVersionBadge = 'versioning:badge',
  DebugNconf = 'debug:nconf',
  DebugReadme = 'debug:readme',
  DebugConfig = 'debug:config',
  DebugAction = 'debug:action',
  DebugGithub = 'debug:github',
}

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
export const GITHUB_ACTIONS_OMITTED_ICONS: Set<string> = new Set([
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
export const GITHUB_ACTIONS_BRANDING_ICONS: Set<string> = new Set(
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
 * The value comes from an unvalidated action.yml, so it is an arbitrary
 * string until this guard narrows it — `Partial<FeatherIconNames>` was a
 * misuse of `Partial` on a string-literal union (it doesn't express
 * "optional"/"unvalidated" the way it does for object types).
 * @param {string} icon - The icon to validate.
 * @returns A boolean indicating if the icon is valid.
 */
export function isValidIcon(icon: string): icon is FeatherIconNames {
  return GITHUB_ACTIONS_BRANDING_ICONS.has(icon);
}

/**
 * Checks if the given color is valid for GitHub Actions branding.
 * The value comes from an unvalidated action.yml, so it is an arbitrary
 * string until this guard narrows it — see {@link isValidIcon}.
 * @param {string} color - The color to validate.
 * @returns A boolean indicating if the color is valid.
 */
export function isValidColor(color: string): color is BrandColors {
  return GITHUB_ACTIONS_BRANDING_COLORS.includes(color as BrandColors);
}

/**
 * Represents the branding information for the action.
 * Values are read from a user-supplied, unvalidated action.yml, so they are
 * plain strings until validated with {@link isValidIcon} / {@link isValidColor}.
 */
export interface Branding {
  /** Color for the action branding */
  color: string;
  icon: string;
}
