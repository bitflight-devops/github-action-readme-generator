import { FeatherIconNames, icons } from 'feather-icons';
import { describe, expect, it } from 'vitest';

import {
  ALIGNMENT_MARKUP,
  BrandColors,
  brandingSquareEdgeLengthInPixels,
  configFileName,
  ConfigKeys,
  DEFAULT_BRAND_COLOR,
  DEFAULT_BRAND_ICON,
  GITHUB_ACTIONS_BRANDING_COLORS,
  GITHUB_ACTIONS_BRANDING_ICONS,
  GITHUB_ACTIONS_OMITTED_ICONS,
  isValidColor,
  isValidIcon,
  README_SECTIONS,
  ReadmeSection,
} from '../src/constants.js';

describe('isValidIcon', () => {
  it('should return true for valid icon', () => {
    const validIcon: Partial<FeatherIconNames> = 'activity';
    const result = isValidIcon(validIcon);
    expect(result).toBe(true);
  });

  it('should return false for invalid icon', () => {
    const invalidIcon = 'invalid-icon' as Partial<FeatherIconNames>;
    const result = isValidIcon(invalidIcon);
    expect(result).toBe(false);
  });
});

describe('isValidColor', () => {
  it('should return true for valid color', () => {
    const validColor: Partial<BrandColors> = 'blue';
    const result = isValidColor(validColor);
    expect(result).toBe(true);
  });

  it('should return false for invalid color', () => {
    const invalidColor = 'invalid-color' as Partial<BrandColors>;
    const result = isValidColor(invalidColor);
    expect(result).toBe(false);
  });
});

describe('README_SECTIONS', () => {
  it('should contain the correct sections', () => {
    const expectedSections: ReadmeSection[] = [
      'title',
      'branding',
      'description',
      'usage',
      'inputs',
      'outputs',
      'contents',
      'badges',
    ];
    expect(README_SECTIONS).toEqual(expectedSections);
  });
});

describe('configFileName', () => {
  it('should have the correct file name', () => {
    expect(configFileName).toBe('.ghadocs.json');
  });
});

describe('ConfigKeys', () => {
  it('should contain the correct keys', () => {
    const expectedKeys = {
      Owner: 'owner',
      Repo: 'repo',
      TitlePrefix: 'title_prefix',
      Prettier: 'prettier',
      Save: 'save',
      pathsAction: 'paths:action',
      pathsReadme: 'paths:readme',
      BrandingSvgPath: 'branding_svg_path',
      BrandingAsTitlePrefix: 'branding_as_title_prefix',
      VersioningEnabled: 'versioning:enabled',
      VersioningOverride: 'versioning:override',
      VersioningPrefix: 'versioning:prefix',
      VersioningBranch: 'versioning:branch',
      IncludeGithubVersionBadge: 'versioning:badge',
      DebugNconf: 'debug:nconf',
      DebugReadme: 'debug:readme',
      DebugConfig: 'debug:config',
      DebugAction: 'debug:action',
      DebugGithub: 'debug:github',
    };
    expect(ConfigKeys).toEqual(expectedKeys);
  });
});

describe('brandingSquareEdgeLengthInPixels', () => {
  it('should have the correct edge length', () => {
    expect(brandingSquareEdgeLengthInPixels).toBe(50);
  });
});

describe('DEFAULT_BRAND_COLOR', () => {
  it('should have the correct default brand color', () => {
    expect(DEFAULT_BRAND_COLOR).toBe('blue');
  });
});

describe('DEFAULT_BRAND_ICON', () => {
  it('should have the correct default brand icon', () => {
    expect(DEFAULT_BRAND_ICON).toBe('activity');
  });
});

describe('ALIGNMENT_MARKUP', () => {
  it('should have the correct alignment markup', () => {
    expect(ALIGNMENT_MARKUP).toBe('<div align="center">');
  });
});

describe('GITHUB_ACTIONS_OMITTED_ICONS', () => {
  it('should contain the correct omitted icons', () => {
    const expectedOmittedIcons: Set<FeatherIconNames> = new Set([
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
    expect(GITHUB_ACTIONS_OMITTED_ICONS).toEqual(expectedOmittedIcons);
  });
});

describe('GITHUB_ACTIONS_BRANDING_ICONS', () => {
  it('should contain the correct branding icons', () => {
    const expectedBrandingIcons: Set<FeatherIconNames> = new Set(
      Object.keys(icons).filter((item) => !GITHUB_ACTIONS_OMITTED_ICONS.has(item)),
    ) as Set<FeatherIconNames>;
    expect(GITHUB_ACTIONS_BRANDING_ICONS).toEqual(expectedBrandingIcons);
  });
});

describe('GITHUB_ACTIONS_BRANDING_COLORS', () => {
  it('should contain the correct branding colors', () => {
    const expectedBrandingColors: BrandColors[] = [
      'white',
      'yellow',
      'blue',
      'green',
      'orange',
      'red',
      'purple',
      'gray-dark',
    ];
    expect(GITHUB_ACTIONS_BRANDING_COLORS).toEqual(expectedBrandingColors);
  });
});
