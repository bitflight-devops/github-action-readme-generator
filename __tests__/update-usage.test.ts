import { parse } from 'yaml';
import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type Inputs from '../src/inputs.js';
import updateUsage from '../src/sections/update-usage.js';

vi.mock('../src/logtask/index.js');
vi.mock('../src/helpers.js', () => ({
  getCurrentVersionString: (): string => 'v1.2.3',
}));

/** Returns the text between the generated section's ```yaml fences. */
function fenceBody(section: string): string {
  const lines = section.split('\n');
  return lines.slice(lines.indexOf('```yaml') + 1, lines.lastIndexOf('```')).join('\n');
}

describe('updateUsage', () => {
  let mockInputs: Inputs;
  let mockUpdateSection: ReturnType<typeof vi.fn>;

  /** Replaces the mock action's declared inputs with the given map. */
  function inputsWith(
    actionInputs: Record<string, { description: string; default?: string }>,
  ): void {
    (mockInputs as unknown as { action: { inputs: unknown } }).action = { inputs: actionInputs };
  }

  beforeEach(() => {
    mockUpdateSection = vi.fn();
    mockInputs = {
      owner: 'acme',
      repo: 't',
      action: { inputs: {} },
      readmeEditor: {
        updateSection: mockUpdateSection,
      },
    } as unknown as Inputs;
  });

  it('keeps a single-line default on the Default comment line', async () => {
    inputsWith({ action: { description: 'path to the action file', default: 'action.yml' } });

    const result = await updateUsage('usage', mockInputs);

    expect(result.usage).toContain('    # Default: action.yml');
    expect(mockUpdateSection).toHaveBeenCalledWith('usage', expect.any(Array));
  });

  it.each([
    ['LF', 'first\nsecond'],
    ['CRLF', 'first\r\nsecond'],
    ['CR', 'first\rsecond'],
  ])('keeps a %s line break inside the comment', async (_name, value) => {
    inputsWith({ k: { description: 'd', default: value } });

    const result = await updateUsage('usage', mockInputs);
    const body = fenceBody(result.usage);

    expect(parse(body)).toEqual([{ uses: 'acme/t@v1.2.3', with: { k: '' } }]);
    expect(result.usage).toContain('    #          second');
    expect(result.usage).not.toMatch(/\r/);
  });

  it('hangs a multi-line default under its value, not at description column', async () => {
    inputsWith({
      a: { description: 'Long prose.\n\nAnother paragraph.', default: 'first\nsecond' },
    });

    const result = await updateUsage('usage', mockInputs);
    const lines = result.usage.split('\n');

    expect(lines).toContain('    # Another paragraph.');
    expect(lines).toContain('    #          second');
    expect(lines).not.toContain('    # second');
  });

  it('separates a paragraph description from the Default line with a blank comment line', async () => {
    inputsWith({ a: { description: 'First paragraph.\n\nSecond paragraph.', default: 'x' } });

    const result = await updateUsage('usage', mockInputs);
    const lines = result.usage.split('\n');
    const defaultIndex = lines.findIndex((line) => line.includes('# Default: x'));

    expect(lines).toContain('    # Second paragraph.');
    expect(defaultIndex).toBeGreaterThan(0);
    expect(lines[defaultIndex - 1]).toMatch(/^ *# *$/);
  });

  it('emits parseable YAML for a multi-line default', async () => {
    inputsWith({ multi: { description: 'has a multi-line default', default: 'line1\nline2' } });

    const result = await updateUsage('usage', mockInputs);
    const body = fenceBody(result.usage);

    expect(() => parse(body)).not.toThrow();
    expect(parse(body)).toEqual([{ uses: 'acme/t@v1.2.3', with: { multi: '' } }]);
  });

  it('comments every continuation line of a multi-line default', async () => {
    inputsWith({ multi: { description: 'has a multi-line default', default: 'line1\nline2' } });

    const result = await updateUsage('usage', mockInputs);

    expect(result.usage).toContain('    # Default: line1');
    expect(result.usage).toContain('    #          line2');
    expect(result.usage).not.toMatch(/^line2$/m);
  });

  it('writes a blank comment line with no trailing whitespace for an empty default line', async () => {
    inputsWith({ multi: { description: 'paragraphs in the default', default: 'first\n\nsecond' } });

    const result = await updateUsage('usage', mockInputs);

    expect(result.usage).toContain('\n    # Default: first\n    #\n    #          second\n');
  });
});
