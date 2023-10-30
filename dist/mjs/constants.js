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
];
export const configFileName = '.ghadocs.json';
export var ConfigKeys;
(function (ConfigKeys) {
    ConfigKeys["Save"] = "save";
    ConfigKeys["pathsAction"] = "paths:action";
    ConfigKeys["pathsReadme"] = "paths:readme";
    ConfigKeys["BrandingSvgPath"] = "branding_svg_path";
    ConfigKeys["BrandingAsTitlePrefix"] = "branding_as_title_prefix";
    ConfigKeys["VersioningEnabled"] = "versioning:enabled";
    ConfigKeys["VersioningOverride"] = "versioning:override";
    ConfigKeys["VersioningPrefix"] = "versioning:prefix";
    ConfigKeys["VersioningBranch"] = "versioning:branch";
    ConfigKeys["Owner"] = "owner";
    ConfigKeys["Repo"] = "repo";
    ConfigKeys["TitlePrefix"] = "title_prefix";
    ConfigKeys["Prettier"] = "prettier";
    ConfigKeys["IncludeGithubVersionBadge"] = "versioning:badge";
})(ConfigKeys || (ConfigKeys = {}));
export const RequiredInputs = [
    ConfigKeys.pathsAction,
    ConfigKeys.pathsReadme,
    ConfigKeys.Owner,
    ConfigKeys.Repo,
];
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
export const GITHUB_ACTIONS_BRANDING_ICONS = new Set(Object.keys(icons).filter((item) => !GITHUB_ACTIONS_OMITTED_ICONS.has(item)));
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
export function isValidIcon(icon) {
    return GITHUB_ACTIONS_BRANDING_ICONS.has(icon);
}
export function isValidColor(color) {
    return GITHUB_ACTIONS_BRANDING_COLORS.includes(color);
}
//# sourceMappingURL=constants.js.map