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
