import { format } from 'prettier';

import LogTask from './logtask/index.js';

const log = new LogTask('prettier');
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
  prefix = '    # ',
): Promise<string[]> {
  if (!value) return content ?? [];
  // const valueWithoutPrefix = prefix && prefix.length > 0 ? value.replace(prefix, '') : value;
  let formattedString = '';
  try {
    formattedString = await format(value, {
      semi: false,
      parser: 'markdown',
      proseWrap: 'always',
    });
  } catch (error) {
    log.error(`${error}`);
  }

  content.push(...formattedString.split('\n').map((line) => prefix + line.replace(prefix, '')));
  return content;
}
