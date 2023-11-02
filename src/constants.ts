import type { FeatherIconNames } from 'feather-icons';
import { icons } from 'feather-icons';

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
export type ReadmeSection = (typeof README_SECTIONS)[number];
export const configFileName = '.ghadocs.json';

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
export const RequiredInputs = [
  ConfigKeys.pathsAction,
  ConfigKeys.pathsReadme,
  ConfigKeys.Owner,
  ConfigKeys.Repo,
] as const;

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
