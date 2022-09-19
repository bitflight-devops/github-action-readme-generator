import { format } from 'prettier';

export function formatYaml(value: string, filepath?: string): string {
  const fp = filepath ? { filepath } : {};
  return format(value, {
    semi: false,
    parser: 'yaml',
    embeddedLanguageFormatting: 'auto',
    ...fp,
  });
}
export function formatMarkdown(value: string, filepath?: string): string {
  const fp = filepath ? { filepath } : {};
  return format(value, {
    semi: false,
    parser: 'markdown',
    embeddedLanguageFormatting: 'auto',
    ...fp,
  });
}
