/**
 * This TypeScript code imports the necessary modules and defines two interfaces: `Versioning` and `Paths`.
 * It also defines a class named `GHActionDocsConfig` that represents the configuration for generating GitHub Actions documentation.
 * The class has properties that correspond to the configuration options and a method `loadInputs` to load the configuration from the provided `Inputs` object.
 * The class also has a method `save` to save the configuration to a file.
 */
import { promises as fsPromises } from 'node:fs';
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
    prettier;
    /**
     * Loads the configuration from the provided `Inputs` object.
     * @param {Inputs} inputs - The `Inputs` object containing the configuration values.
     */
    loadInputs(inputs) {
        const config = inputs.config.get();
        this.owner = config.owner;
        this.repo = config.repo;
        this.title_prefix = config.title_prefix;
        this.title = config.title;
        this.paths = config.paths;
        this.branding_svg_path = config.branding_svg_path;
        this.versioning = config.versioning;
        this.prettier = config.prettier;
    }
    /**
     * Saves the configuration to a file. If the file exists, it will be overwritten.
     * @param {string} configPath - The path to the configuration file.
     */
    async save(configPath) {
        const log = new LogTask('config:save');
        const directory = path.dirname(configPath);
        try {
            await fsPromises.mkdir(directory, { recursive: true });
        }
        catch (error) {
            log.error(`Error creating directory: ${directory}.`);
            throw error;
        }
        try {
            await fsPromises.writeFile(configPath, JSON.stringify(this, null, 2));
            log.info(`Config file written to: ${configPath}`);
        }
        catch (error) {
            log.error(`Error writing config file: ${configPath}.`);
            throw error;
        }
    }
}
//# sourceMappingURL=config.js.map