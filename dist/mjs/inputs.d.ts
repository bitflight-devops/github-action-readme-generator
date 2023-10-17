import Action from './Action.js';
import { Provider } from './nconf/nconf.cjs';
import ReadmeEditor from './readme-editor.js';
export declare const configFileName = ".ghadocs.json";
export declare const configKeys: string[];
type ProviderInstance = InstanceType<typeof Provider>;
export default class Inputs {
    config: ProviderInstance;
    sections: string[];
    readmePath: string;
    configPath: string;
    action: Action;
    readmeEditor: ReadmeEditor;
    constructor();
    setConfigValueFromActionFileDefault(inputName: string, providedConfigName?: string): void;
    stringify(): string;
}
export {};
