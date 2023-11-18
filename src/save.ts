/**
 * This code exports a function named 'save' which takes an instance of the 'Inputs' class as its parameter.
 * The function reads the configuration inputs from the 'inputs' parameter and uses them to create a new instance of the 'GHActionDocsConfig' class.
 * If the 'save' property is set to true in the configuration inputs, the function saves the configuration to the file specified in the 'configPath' property of the 'inputs' parameter.
 * This script is used to update the usage section in the README.md file to match the contents of the action.yml file.
 */

import { GHActionDocsConfig } from './config.js';
import Inputs from './inputs.js';
import LogTask from './logtask/index.js';

/**
 * This script rebuilds the usage section in the README.md to be consistent with the action.yml
 * @param {Inputs} inputs - the inputs class
 */
export default function save(inputs: Inputs, log: LogTask): void {
  const docsConfig = new GHActionDocsConfig();
  docsConfig.loadInputs(inputs);
  if (inputs.config.get().save === true) {
    try {
      docsConfig.save(inputs.configPath);
    } catch (error) {
      log.error(`${error}`);
    }
  }
}
