import { format } from 'prettier';
import LogTask from './logtask/index.js';
const log = new LogTask('prettier');
export async function formatYaml(value, filepath) {
    const fp = filepath ? { filepath } : {};
    return format(value, {
        semi: false,
        parser: 'yaml',
        embeddedLanguageFormatting: 'auto',
        ...fp,
    });
}
export async function formatMarkdown(value, filepath) {
    const fp = filepath ? { filepath } : {};
    return format(value, {
        semi: false,
        parser: 'markdown',
        embeddedLanguageFormatting: 'auto',
        ...fp,
    });
}
export async function wrapDescription(value, content, prefix = '    # ') {
    if (!value)
        return content ?? [];
    // const valueWithoutPrefix = prefix && prefix.length > 0 ? value.replace(prefix, '') : value;
    let formattedString = '';
    try {
        formattedString = await format(value, {
            semi: false,
            parser: 'yaml',
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