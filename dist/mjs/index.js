import Inputs from './inputs.js';
import LogTask from './logtask/index.js';
import { ReadmeGenerator } from './readme-generator.js';
import save from './save.js';
/**
 * Creates a ReadmeGenerator instance and generates docs.
 */
export async function generateReadme() {
    const log = new LogTask('Generate Documentation');
    const inputs = new Inputs();
    const generator = new ReadmeGenerator(inputs, log);
    await generator.generate();
    return save(inputs, log);
}
await generateReadme();
//# sourceMappingURL=index.js.map