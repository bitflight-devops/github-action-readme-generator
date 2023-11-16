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
];
/**
 * Represents the file name for the configuration file.
 */
export const configFileName = '.ghadocs.json';
/**
 * Enumerates the keys for the configuration options.
 */
export var ConfigKeys;
(function (ConfigKeys) {
    ConfigKeys["Owner"] = "owner";
    ConfigKeys["Repo"] = "repo";
    ConfigKeys["TitlePrefix"] = "title_prefix";
    ConfigKeys["Prettier"] = "prettier";
    ConfigKeys["Save"] = "save";
    ConfigKeys["pathsAction"] = "paths:action";
    ConfigKeys["pathsReadme"] = "paths:readme";
    ConfigKeys["BrandingSvgPath"] = "branding_svg_path";
    ConfigKeys["BrandingAsTitlePrefix"] = "branding_as_title_prefix";
    ConfigKeys["VersioningEnabled"] = "versioning:enabled";
    ConfigKeys["VersioningOverride"] = "versioning:override";
    ConfigKeys["VersioningPrefix"] = "versioning:prefix";
    ConfigKeys["VersioningBranch"] = "versioning:branch";
    ConfigKeys["IncludeGithubVersionBadge"] = "versioning:badge";
    ConfigKeys["DebugNconf"] = "debug:nconf";
    ConfigKeys["DebugReadme"] = "debug:readme";
    ConfigKeys["DebugConfig"] = "debug:config";
    ConfigKeys["DebugAction"] = "debug:action";
    ConfigKeys["DebugGithub"] = "debug:github";
})(ConfigKeys || (ConfigKeys = {}));
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
export const GITHUB_ACTIONS_BRANDING_ICONS = new Set(Object.keys(icons).filter((item) => !GITHUB_ACTIONS_OMITTED_ICONS.has(item)));
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
];
/**
 * Checks if the given icon is valid for GitHub Actions branding.
 * @param {Partial<FeatherIconNames>} icon - The icon to validate.
 * @returns A boolean indicating if the icon is valid.
 */
export function isValidIcon(icon) {
    return GITHUB_ACTIONS_BRANDING_ICONS.has(icon);
}
/**
 * Checks if the given color is valid for GitHub Actions branding.
 * @param {Partial<BrandColors>} color - The color to validate.
 * @returns A boolean indicating if the color is valid.
 */
export function isValidColor(color) {
    return GITHUB_ACTIONS_BRANDING_COLORS.includes(color);
}
//# sourceMappingURL=constants.js.map