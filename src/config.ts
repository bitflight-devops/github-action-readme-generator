export interface Versioning {
  enabled: boolean;
  prefixed: string;
}
export interface Paths {
  action: string;
  readme: string;
}
export declare class GHActionDocsConfig {
  owner: string;

  repo: string;

  title_prefix: string;

  title: string;

  paths: Paths;

  show_logo: boolean;

  versioning: Versioning;

  readmePath: string;

  outpath: string;
}

export const startTokenFormat = '<!-- start %s -->';
export const endTokenFormat = '<!-- end %s -->';
