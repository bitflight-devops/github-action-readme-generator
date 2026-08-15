import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type Inputs from '../src/inputs.js';
import updateBadges from '../src/sections/update-badges.js';

vi.mock('../src/logtask/index.js');

describe('updateBadges', () => {
  let mockInputs: Inputs;
  let mockUpdateSection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUpdateSection = vi.fn();
    mockInputs = {
      owner: 'bitflight-devops',
      repo: 'github-action-readme-generator',
      config: {
        get: vi.fn().mockReturnValue({ versioning: { badge: true } }),
      },
      readmeEditor: {
        updateSection: mockUpdateSection,
      },
    } as unknown as Inputs;
  });

  it('generates navigable badge links and human-readable alternative text', () => {
    const result = updateBadges('badges', mockInputs);

    expect(result.badges).toContain(
      'href="https://github.com/bitflight-devops/github-action-readme-generator/releases/latest"',
    );
    expect(result.badges).toContain('alt="Release by tag"');
    expect(result.badges).not.toContain('href="https%3A%2F%2F');
    expect(result.badges).not.toContain('alt="Release%20by%20tag"');
    expect(mockUpdateSection).toHaveBeenCalledWith('badges', result.badges);
  });

  it('escapes HTML metacharacters without percent-encoding the URL', () => {
    mockInputs.owner = 'owner&"';

    const result = updateBadges('badges', mockInputs);

    expect(result.badges).toContain('href="https://github.com/owner&amp;&quot;/');
    expect(result.badges).not.toContain('owner%26%22');
  });
});
