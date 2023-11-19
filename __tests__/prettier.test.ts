import { format } from 'prettier';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatMarkdown, formatYaml, wrapDescription } from '../src/prettier.js';

vi.mock('prettier');
describe('prettier', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    // restore replaced property
    vi.restoreAllMocks();
  });
  describe('formatYaml', () => {
    it('should format YAML string using prettier', async () => {
      const yamlString = 'your yaml string';
      const formattedYaml = 'formatted yaml string';
      vi.mocked(format).mockResolvedValueOnce(formattedYaml);

      const result = await formatYaml(yamlString);

      expect(result).toBe(formattedYaml);
      expect(format).toHaveBeenCalledWith(yamlString, {
        semi: false,
        parser: 'yaml',
        embeddedLanguageFormatting: 'auto',
      });
    });

    it('should format YAML string with filepath using prettier', async () => {
      const yamlString = 'your yaml string';
      const filepath = 'your filepath';
      const formattedYaml = 'formatted yaml string';
      vi.mocked(format).mockResolvedValueOnce(formattedYaml);

      const result = await formatYaml(yamlString, filepath);

      expect(result).toBe(formattedYaml);
      expect(format).toHaveBeenCalledWith(yamlString, {
        semi: false,
        parser: 'yaml',
        embeddedLanguageFormatting: 'auto',
        filepath,
      });
    });
  });

  describe('formatMarkdown', () => {
    it('should format Markdown string using prettier', async () => {
      const markdownString = 'your markdown string';
      const formattedMarkdown = 'formatted markdown string';
      vi.mocked(format).mockResolvedValueOnce(formattedMarkdown);

      const result = await formatMarkdown(markdownString);

      expect(result).toBe(formattedMarkdown);
      expect(format).toHaveBeenCalledWith(markdownString, {
        semi: false,
        parser: 'markdown',
        embeddedLanguageFormatting: 'auto',
      });
    });

    it('should format Markdown string with filepath using prettier', async () => {
      const markdownString = 'your markdown string';
      const filepath = 'your filepath';
      const formattedMarkdown = 'formatted markdown string';
      vi.mocked(format).mockResolvedValueOnce(formattedMarkdown);

      const result = await formatMarkdown(markdownString, filepath);

      expect(result).toBe(formattedMarkdown);
      expect(format).toHaveBeenCalledWith(markdownString, {
        semi: false,
        parser: 'markdown',
        embeddedLanguageFormatting: 'auto',
        filepath,
      });
    });
  });

  describe('wrapDescription', () => {
    it('should wrap and format description text using prettier', async () => {
      const description = 'your description';
      const content = ['line 1', 'line 2'];
      const prefix = '    # ';
      const formattedDescription = 'formatted description';
      vi.mocked(format).mockResolvedValueOnce(formattedDescription);

      const result = await wrapDescription(description, content, prefix);

      expect(result).toEqual([
        'line 1',
        'line 2',
        ...formattedDescription.split('\n').map((line) => prefix + line.replace(prefix, '')),
      ]);
      expect(format).toHaveBeenCalledWith(description, {
        semi: false,
        parser: 'markdown',
        proseWrap: 'always',
      });
    });

    it('should return content array if description is undefined', async () => {
      const content = ['line 1', 'line 2'];

      const result = await wrapDescription(undefined, content);
      vi.mocked(format).mockClear();
      expect(result).toEqual(content);
      expect(format).not.toHaveBeenCalled();
    });
  });
});
