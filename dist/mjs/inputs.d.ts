import { Provider } from 'nconf';
import Action from './Action.js';
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
    setConfigValueFromActionFileDefault(actionInstance: Action, inputName: string, providedConfigName?: string): void;
    stringify(): string;
}
export {};
