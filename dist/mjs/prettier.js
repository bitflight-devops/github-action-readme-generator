/**
 * This TypeScript code exports three functions: `formatYaml`, `formatMarkdown`, and `wrapDescription`.
 *
 * - `formatYaml` takes a YAML string and an optional filepath as parameters and uses the `prettier` library to format the YAML code. It returns the formatted YAML string.
 * - `formatMarkdown` takes a Markdown string and an optional filepath as parameters and uses the `prettier` library to format the Markdown code. It returns the formatted Markdown string.
 * - `wrapDescription` takes a string value, an array of content, and an optional prefix as parameters. It wraps the description text with the specified prefix and formats it using `prettier`. It returns the updated content array with the formatted description lines.
 *
 * The code utilizes the `prettier` library for code formatting and the `LogTask` class for logging purposes.
 */
import { format } from 'prettier';
import LogTask from './logtask/index.js';
const log = new LogTask('prettier');
/**
 * Formats a YAML string using `prettier`.
 * @param {string} value - The YAML string to format.
 * @param {string} [filepath] - The optional filepath.
 * @returns {Promise<string>} A promise that resolves with the formatted YAML string.
 */
export async function formatYaml(value, filepath) {
    const fp = filepath ? { filepath } : {};
    return format(value, {
        semi: false,
        parser: 'yaml',
        embeddedLanguageFormatting: 'auto',
        ...fp,
    });
}
/**
 * Formats a Markdown string using `prettier`.
 * @param {string} value - The Markdown string to format.
 * @param {string} [filepath] - The optional filepath.
 * @returns {Promise<string>} A promise that resolves with the formatted Markdown string.
 */
export async function formatMarkdown(value, filepath) {
    const fp = filepath ? { filepath } : {};
    return format(value, {
        semi: false,
        parser: 'markdown',
        embeddedLanguageFormatting: 'auto',
        ...fp,
    });
}
/**
 * Wraps a description text with a prefix and formats it using `prettier`.
 * @param {string | undefined} value - The description text to wrap and format.
 * @param {string[]} content - The array of content to update.
 * @param {string} [prefix='    # '] - The optional prefix to wrap the description lines.
 * @returns {Promise<string[]>} A promise that resolves with the updated content array.
 */
export async function wrapDescription(value, content, prefix = '    # ') {
    if (!value)
        return content ?? [];
    // const valueWithoutPrefix = prefix && prefix.length > 0 ? value.replace(prefix, '') : value;
    let formattedString = '';
    try {
        formattedString = await format(value, {
            semi: false,
            parser: 'markdown',
            proseWrap: 'always',
        });
    }
    catch (error) {
        log.error(`${error}`);
    }
    content.push(...formattedString.split('\n').map((line) => prefix + line.replace(prefix, '')));
    return content;
}
//# sourceMappingURL=prettier.js.map