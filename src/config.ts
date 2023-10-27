/**
 * This TypeScript code imports the necessary modules and defines two interfaces: `Versioning` and `Paths`.
 * It also defines a class named `GHActionDocsConfig` that represents the configuration for generating GitHub Actions documentation.
 * The class has properties that correspond to the configuration options and a method `loadInputs` to load the configuration from the provided `Inputs` object.
 * The class also has a method `save` to save the configuration to a file.
 */

import fs from 'node:fs';
import path from 'node:path';

import type Inputs from './inputs.js';
import LogTask from './logtask/index.js';

/**
 * Represents the versioning configuration for GitHub Actions documentation.
 */
export interface Versioning {
  enabled?: boolean;
  prefix?: string;
  override?: string;
  branch?: string;
}

/**
 * Represents the paths configuration for GitHub Actions documentation.
 */
export interface Paths {
  action: string;
  readme: string;
}

/**
 * Represents the configuration for generating GitHub Actions documentation.
 */
export class GHActionDocsConfig {
  owner?: string;

  repo?: string;

  title_prefix?: string;

  title?: string;

  paths?: Paths;

  branding_svg_path?: string;

  versioning?: Versioning;

  readmePath?: string;

  outpath?: string;

  pretty?: boolean;

  /**
   * Loads the configuration from the provided `Inputs` object.
   * @param {Inputs} inputs - The `Inputs` object containing the configuration values.
   */
  loadInputs(inputs: Inputs): void {
    this.owner = inputs.config.get('owner') as string;
    this.repo = inputs.config.get('repo') as string;
    this.title_prefix = inputs.config.get('title_prefix') as string;
    this.title = inputs.config.get('title') as string;
    this.paths = inputs.config.get('paths') as Paths;
    this.branding_svg_path = inputs.config.get('branding_svg_path') as string;
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
   * Saves the configuration to a file. If the file exists, it will be overwritten.
   * @param {string} configPath - The path to the configuration file.
   */
  save(configPath: string): void {
    const log = new LogTask('config:save');
    // Validate that the directory exists
    const directory = path.dirname(configPath);
    // Create the directory if it doesn't exist
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
