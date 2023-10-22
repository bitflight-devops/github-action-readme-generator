import { format } from 'prettier';
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
export async function wrapDescription(value, content, prefix) {
    if (!value)
        return content ?? [];
    const valueWithoutPrefix = prefix ? value.replace(prefix, '') : value;
    const formattedString = await format(`${prefix ?? ''}${valueWithoutPrefix}`, {
        semi: false,
        parser: 'yaml',
        proseWrap: 'always',
    });
    content.push(...formattedString.split('\n'));
    return content;
}
//# sourceMappingURL=prettier.js.map