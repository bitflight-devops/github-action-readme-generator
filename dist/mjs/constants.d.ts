import type { FeatherIconNames } from 'feather-icons';
export declare const README_SECTIONS: readonly ["title", "branding", "description", "usage", "inputs", "outputs", "contents", "badges"];
export type ReadmeSection = (typeof README_SECTIONS)[number];
export declare const configFileName = ".ghadocs.json";
export declare enum ConfigKeys {
    Save = "save",
    pathsAction = "paths:action",
    pathsReadme = "paths:readme",
    BrandingSvgPath = "branding_svg_path",
    BrandingAsTitlePrefix = "branding_as_title_prefix",
    VersioningEnabled = "versioning:enabled",
    VersioningOverride = "versioning:override",
    VersioningPrefix = "versioning:prefix",
    VersioningBranch = "versioning:branch",
    Owner = "owner",
    Repo = "repo",
    TitlePrefix = "title_prefix",
    Prettier = "prettier",
    IncludeGithubVersionBadge = "versioning:badge"
}
export declare const RequiredInputs: readonly [ConfigKeys.pathsAction, ConfigKeys.pathsReadme, ConfigKeys.Owner, ConfigKeys.Repo];
export declare const brandingSquareEdgeLengthInPixels = 50;
export declare const DEFAULT_BRAND_COLOR = "blue";
export declare const DEFAULT_BRAND_ICON = "activity";
export declare const ALIGNMENT_MARKUP = "<div align=\"center\">";
export declare const GITHUB_ACTIONS_OMITTED_ICONS: Set<string>;
export declare const GITHUB_ACTIONS_BRANDING_ICONS: Set<string>;
export declare const GITHUB_ACTIONS_BRANDING_COLORS: readonly ["white", "yellow", "blue", "green", "orange", "red", "purple", "gray-dark"];
export type BrandColors = (typeof GITHUB_ACTIONS_BRANDING_COLORS)[number];
export declare function isValidIcon(icon: Partial<FeatherIconNames>): icon is FeatherIconNames;
export declare function isValidColor(color: Partial<BrandColors>): color is BrandColors;
/**
 * Branding information for the action.
 */
export interface Branding {
    /** Color for the action branding */
    color: Partial<BrandColors>;
    icon: Partial<FeatherIconNames>;
}
