/**
 * This TypeScript code defines a class named 'Inputs' that handles input configuration and manipulation.
 * It imports various modules and packages for file operations, configuration parsing, and logging.
 * The class has methods for initializing the input configuration, setting default values, and converting the configuration to a string.
 * It also has properties for storing the configuration values, sections, readme path, action instance, and readme editor instance.
 */
import { Provider } from 'nconf';
import Action from './Action.js';
import ReadmeEditor from './readme-editor.js';
import { ReadmeSection } from './sections/index.js';
export declare const configFileName = ".ghadocs.json";
type ProviderInstance = InstanceType<typeof Provider>;
export default class Inputs {
    config: ProviderInstance;
    sections: ReadmeSection[];
    readmePath: string;
    configPath: string;
    action: Action;
    readmeEditor: ReadmeEditor;
    /**
     * Initializes a new instance of the Inputs class.
     */
    constructor();
    stringify(): string;
}
export {};
