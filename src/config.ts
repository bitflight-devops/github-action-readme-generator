import fs from 'node:fs';
import path from 'node:path';

import type Inputs from './inputs.js';
import LogTask from './logtask/index.js';

export interface Versioning {
  enabled?: boolean;
  prefix?: string;
  override?: string;
  branch?: string;
}
export interface Paths {
  action: string;
  readme: string;
}
export class GHActionDocsConfig {
  owner?: string;

  repo?: string;

  title_prefix?: string;

  title?: string;

  paths?: Paths;

  github_action_branding_svg_path?: string;

  versioning?: Versioning;

  readmePath?: string;

  outpath?: string;

  pretty?: boolean;

  loadInputs(inputs: Inputs): void {
    this.owner = inputs.config.get('owner') as string;
    this.repo = inputs.config.get('repo') as string;
    this.title_prefix = inputs.config.get('title_prefix') as string;
    this.title = inputs.config.get('title') as string;
    this.paths = inputs.config.get('paths') as Paths;
    this.github_action_branding_svg_path = inputs.config.get(
      'github_action_branding_svg_path',
    ) as string;
    this.versioning = {
      enabled: inputs.config.get('versioning:enabled') as boolean,
      prefix: inputs.config.get('versioning:prefix') as string,
      override: inputs.config.get('versioning:override') as string,
      branch: inputs.config.get('versioning:branch') as string,
    };
    this.outpath = inputs.config.get('outpath') as string;
    this.pretty = inputs.config.get('pretty') as boolean;
  }

  /**
   *
   * @param configPath {string}
   * @description Saves the config to a file,if the file exists it will be overwritten.
   */
  save(configPath: string): void {
    const log = new LogTask('config:save');
    // validate that that the directory exists
    const directory = path.dirname(configPath);
    // make the directory if it doesn't exist
    fs.mkdir(directory, { recursive: true }, (err) => {
      if (err) {
        log.error(`Error creating directory: ${directory}. Error: ${err}`);
      }
    });
    return fs.writeFile(configPath, JSON.stringify(this, null, 2), (err) => {
      if (err) {
        log.error(`Error writing config file: ${configPath}. Error: ${err}`);
      } else {
        log.info(`Config file written to: ${configPath}`);
      }
    });
  }
}
