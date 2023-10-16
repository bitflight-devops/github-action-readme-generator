import { GHActionDocsConfig } from './config';
import Inputs from './inputs';

// This script rebuilds the usage section in the README.md to be consistent with the action.yml
export default function save(inputs: Inputs): void {
  const docsConfig = new GHActionDocsConfig();
  docsConfig.loadInputs(inputs);
  if (inputs.config.get('save').toString() === 'true') {
    docsConfig.save(inputs.configPath);
  }
}
