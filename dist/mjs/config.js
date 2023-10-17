import fs from 'node:fs';
import path from 'node:path';
import LogTask from './logtask/index.js';
export class GHActionDocsConfig {
    owner;
    repo;
    title_prefix;
    title;
    paths;
    github_action_branding_svg_path;
    versioning;
    readmePath;
    outpath;
    pretty;
    loadInputs(inputs) {
        this.owner = inputs.config.get('owner');
        this.repo = inputs.config.get('repo');
        this.title_prefix = inputs.config.get('title_prefix');
        this.title = inputs.config.get('title');
        this.paths = inputs.config.get('paths');
        this.github_action_branding_svg_path = inputs.config.get('github_action_branding_svg_path');
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
     *
     * @param configPath {string}
     * @description Saves the config to a file,if the file exists it will be overwritten.
     */
    save(configPath) {
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
            }
            else {
                log.info(`Config file written to: ${configPath}`);
            }
        });
    }
}
//# sourceMappingURL=config.js.map