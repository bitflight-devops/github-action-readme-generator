/**
 * This TypeScript code imports the necessary modules and defines two interfaces: `Versioning` and `Paths`.
 * It also defines a class named `GHActionDocsConfig` that represents the configuration for generating GitHub Actions documentation.
 * The class has properties that correspond to the configuration options and a method `loadInputs` to load the configuration from the provided `Inputs` object.
 * The class also has a method `save` to save the configuration to a file.
 */
import fs from 'node:fs';
import path from 'node:path';
import LogTask from './logtask/index.js';
/**
 * Represents the configuration for generating GitHub Actions documentation.
 */
export class GHActionDocsConfig {
    owner;
    repo;
    title_prefix;
    title;
    paths;
    branding_svg_path;
    versioning;
    readmePath;
    outpath;
    pretty;
    /**
     * Loads the configuration from the provided `Inputs` object.
     * @param {Inputs} inputs - The `Inputs` object containing the configuration values.
     */
    loadInputs(inputs) {
        this.owner = inputs.config.get('owner');
        this.repo = inputs.config.get('repo');
        this.title_prefix = inputs.config.get('title_prefix');
        this.title = inputs.config.get('title');
        this.paths = inputs.config.get('paths');
        this.branding_svg_path = inputs.config.get('branding_svg_path');
        this.versioning = {
            enabled: inputs.config.get('versioning:enabled'),
            prefix: inputs.config.get('versioning:prefix'),
            override: inputs.config.get('versioning:override'),
            branch: inputs.config.get('versioning:branch'),
        };
        this.outpath = inputs.config.get('outpath');
        this.pretty = inputs.config.get('pretty');
    }
    /**
     * Saves the configuration to a file. If the file exists, it will be overwritten.
     * @param {string} configPath - The path to the configuration file.
     */
    save(configPath) {
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
            }
            else {
                log.info(`Config file written to: ${configPath}`);
            }
        });
    }
}
//# sourceMappingURL=config.js.map