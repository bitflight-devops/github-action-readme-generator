/**
 * This TypeScript code defines a class named 'Inputs' that handles input configuration and manipulation.
 * It imports various modules and packages for file operations, configuration parsing, and logging.
 * The class has methods for initializing the input configuration, setting default values, and converting the configuration to a string.
 * It also has properties for storing the configuration values, sections, readme path, action instance, and readme editor instance.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Provider } from 'nconf';
import YAML from 'yaml';
import Action from './Action.js';
import { repositoryFinder } from './helpers.js';
import LogTask from './logtask/index.js';
import ReadmeEditor from './readme-editor.js';
import { README_SECTIONS } from './sections/index.js';
import workingDirectory from './working-directory.js';
const log = new LogTask('inputs');
process.chdir(workingDirectory());
const githubEventPath = process.env.GITHUB_EVENT_PATH ?? '';
let githubEvent = null;
try {
    githubEvent = JSON.parse(fs.readFileSync(githubEventPath, 'utf8'));
}
catch {
    // File not there
    log.debug(`GITHUB_EVENT_PATH not found: ${githubEventPath}`);
}
export const configFileName = '.ghadocs.json';
var ConfigKeys;
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
const RequiredInputs = [
    ConfigKeys.pathsAction,
    ConfigKeys.pathsReadme,
    ConfigKeys.Owner,
    ConfigKeys.Repo,
];
const argvOptions = {};
argvOptions[ConfigKeys.Save] = {
    alias: 'save',
    describe: `Save this config to ${configFileName}`,
    parseValues: true,
    type: 'boolean',
};
argvOptions[ConfigKeys.pathsAction] = {
    alias: ['pathsAction', 'action'],
    type: 'string',
    describe: 'Path to the action.yml',
};
argvOptions[ConfigKeys.pathsReadme] = {
    alias: ['pathsReadme', 'readme'],
    type: 'string',
    describe: 'Path to the README file',
};
argvOptions[ConfigKeys.BrandingSvgPath] = {
    alias: 'svg',
    type: 'string',
    describe: 'Save and load the branding svg image in the README from this path',
};
argvOptions[ConfigKeys.BrandingAsTitlePrefix] = {
    alias: 'branding_prefix',
    type: 'boolean',
    parseValues: true,
    describe: 'Save and load the branding svg image in the README from this path',
};
argvOptions[ConfigKeys.Owner] = {
    alias: 'owner',
    type: 'string',
    describe: 'The GitHub Action repository owner. i.e: `bitflight-devops`',
};
argvOptions[ConfigKeys.Repo] = {
    alias: 'repo',
    type: 'string',
    describe: 'The GitHub Action repository name. i.e: `github-action-readme-generator`',
};
argvOptions[ConfigKeys.Prettier] = {
    alias: ['pretty', 'prettier'],
    type: 'boolean',
    parseValues: true,
    describe: 'Format the markdown using prettier formatter',
};
argvOptions[ConfigKeys.VersioningEnabled] = {
    alias: ['versioning', 'versioning_enabled'],
    describe: 'Enable the update of the usage version to match the latest version in the package.json file',
    parseValues: true,
    type: 'boolean',
};
argvOptions[ConfigKeys.VersioningOverride] = {
    alias: ['setversion', 'versioning_override', 'version_override'],
    describe: 'Set a specific version to display in the README.md',
    parseValues: true,
};
argvOptions[ConfigKeys.VersioningPrefix] = {
    alias: ['vp', 'version_prefix'],
    describe: "Prefix the version with this value (if it isn't already prefixed)",
    parseValues: true,
};
argvOptions[ConfigKeys.VersioningBranch] = {
    alias: ['branch', 'versioning_default_branch'],
    describe: 'If versioning is disabled show this branch instead',
    parseValues: true,
};
argvOptions[ConfigKeys.IncludeGithubVersionBadge] = {
    alias: ['version-badge', 'versioning_badge', 'include_github_version_badge'],
    describe: 'Display the current version as a badge',
    parseValues: true,
    type: 'boolean',
};
argvOptions[ConfigKeys.TitlePrefix] = {
    alias: ['prefix', 'title_prefix'],
    describe: 'Add a prefix to the README title',
    parseValues: true,
};
/**
 * Configuration inputs from the github action don't
 * all match the input names when running on cli.
 * This maps the action inputs to the cli.
 */
const ConfigKeysInputsMap = {
    save: ConfigKeys.Save,
    action: ConfigKeys.pathsAction,
    readme: ConfigKeys.pathsReadme,
    branding_svg_path: ConfigKeys.BrandingSvgPath,
    branding_as_title_prefix: ConfigKeys.BrandingAsTitlePrefix,
    versioning_enabled: ConfigKeys.VersioningEnabled,
    version_prefix: ConfigKeys.VersioningPrefix,
    versioning_default_branch: ConfigKeys.VersioningBranch,
    version_override: ConfigKeys.VersioningOverride,
    include_github_version_badge: ConfigKeys.IncludeGithubVersionBadge,
    owner: ConfigKeys.Owner,
    repo: ConfigKeys.Repo,
    title_prefix: ConfigKeys.TitlePrefix,
    pretty: ConfigKeys.Prettier,
};
export default class Inputs {
    config;
    sections;
    readmePath;
    configPath;
    action;
    readmeEditor;
    /**
     * Initializes a new instance of the Inputs class.
     */
    constructor() {
        this.configPath = path.resolve(configFileName);
        this.config = new Provider();
        const repositoryDetail = repositoryFinder(null, githubEvent);
        if (process.env.GITHUB_ACTION) {
            log.info('Running in GitHub action');
        }
        if (fs.existsSync(this.configPath)) {
            log.info(`Config file found: ${this.configPath}`);
        }
        else {
            log.error(`Config file not found: ${this.configPath}`);
        }
        this.config
            .env({
            lowerCase: true,
            parseValues: true,
            match: /^INPUT_/,
            transform: (obj) => {
                if (obj.key.startsWith('input_') || obj.key.startsWith('INPUT_')) {
                    const keyParsed = obj.key.replace(/^(INPUT|input)_/, '');
                    const newObj = {
                        key: ConfigKeysInputsMap[keyParsed] || keyParsed,
                        value: obj.value,
                    };
                    newObj.key = ConfigKeysInputsMap[keyParsed] || keyParsed;
                    if (newObj.value) {
                        // this.config.set(newObj.key, newObj.value);
                        // eslint-disable-next-line no-param-reassign
                        obj.value = newObj.value;
                    }
                    return obj;
                }
                return undefined;
            },
        })
            .argv(argvOptions)
            .file(this.configPath)
            .defaults({
            owner: repositoryDetail?.owner,
            repo: repositoryDetail?.repo,
            sections: [...README_SECTIONS],
        })
            .required([...RequiredInputs]);
        this.sections = this.config.get('sections');
        const actionPath = path.resolve(this.config.get(ConfigKeys.pathsAction));
        this.action = new Action(actionPath);
        this.readmePath = path.resolve(this.config.get(ConfigKeys.pathsReadme));
        try {
            const thisActionPath = path.join(__dirname, '../../action.yml');
            const thisAction = new Action(thisActionPath);
            this.setConfigValueFromActionFileDefault(thisAction, 'readme', ConfigKeys.pathsReadme);
            this.setConfigValueFromActionFileDefault(thisAction, 'title_prefix');
            this.setConfigValueFromActionFileDefault(thisAction, 'save');
            this.setConfigValueFromActionFileDefault(thisAction, 'pretty');
            this.setConfigValueFromActionFileDefault(thisAction, 'versioning_enabled', 'versioning:enabled');
            this.setConfigValueFromActionFileDefault(thisAction, 'versioning_default_branch', 'versioning:branch');
            this.setConfigValueFromActionFileDefault(thisAction, 'version_override', 'versioning:override');
            this.setConfigValueFromActionFileDefault(thisAction, 'version_prefix', 'versioning:prefix');
            this.setConfigValueFromActionFileDefault(thisAction, 'include_github_version_badge', 'versioning:badges');
            this.setConfigValueFromActionFileDefault(thisAction, 'branding_svg_path');
            this.setConfigValueFromActionFileDefault(thisAction, 'branding_as_title_prefix');
        }
        catch (error) {
            log.info(`failed to load defaults from action's action.yml: ${error}`);
        }
        this.readmeEditor = new ReadmeEditor(this.readmePath);
        if (LogTask.isDebug()) {
            try {
                log.debug('resolved inputs:');
                log.debug(this.stringify());
                log.debug('resolved action:');
                log.debug(this.action.stringify());
            }
            catch (error) {
                if (typeof error === 'string') {
                    log.debug(error);
                }
            }
        }
    }
    setConfigValueFromActionFileDefault(actionInstance, inputName, providedConfigName) {
        const configName = providedConfigName ?? inputName;
        this.config.set(configName, this.config.get(configName) ?? actionInstance.inputDefault(inputName));
    }
    stringify() {
        if (this) {
            const output = [];
            for (const k of Object.keys(ConfigKeys)) {
                output.push(`${k}: ${this.config.get(k)}`);
            }
            return YAML.stringify(output);
        }
        return '';
    }
}
//# sourceMappingURL=inputs.js.map