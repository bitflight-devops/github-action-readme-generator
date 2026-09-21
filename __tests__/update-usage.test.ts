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
    expect(result.usage).toContain('    # line2');
    expect(result.usage).not.toMatch(/^line2$/m);
  });

  it('writes a blank comment line with no trailing whitespace for an empty default line', async () => {
    inputsWith({ multi: { description: 'paragraphs in the default', default: 'first\n\nsecond' } });

    const result = await updateUsage('usage', mockInputs);

    expect(result.usage).toContain('\n    # Default: first\n    #\n    # second\n');
  });
});
