import { format } from 'prettier';

export async function formatYaml(value: string, filepath?: string): Promise<string> {
  const fp = filepath ? { filepath } : {};
  return format(value, {
    semi: false,
    parser: 'yaml',
    embeddedLanguageFormatting: 'auto',
    ...fp,
  });
}
export async function formatMarkdown(value: string, filepath?: string): Promise<string> {
  const fp = filepath ? { filepath } : {};
  return format(value, {
    semi: false,
    parser: 'markdown',
    embeddedLanguageFormatting: 'auto',
    ...fp,
  });
}
export async function wrapDescription(
  value: string | undefined,
  content: string[],
  prefix: string,
): Promise<string[]> {
  if (!value) return content ?? [];
  const valueWithoutPrefix = prefix ? value.replace(prefix, '') : value;
  const formattedString = await format(`${prefix ?? ''}${valueWithoutPrefix}`, {
    semi: false,
    parser: 'yaml',
    proseWrap: 'always',
  });
  content.push(...formattedString.split('\n'));
  return content;
}
