import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('test required environment variables', () => {
  beforeEach(() => {
    vi.stubEnv('GHADOCS_OWNER', 'bitflight-devops');
    vi.stubEnv('GHADOCS_REPOSITORY', 'github-action-readme-generator');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  test('Check Env Vars', () => {
    expect(process.env.GHADOCS_OWNER).toBe('bitflight-devops');
    expect(process.env.GHADOCS_REPOSITORY).toBe('github-action-readme-generator');
  });
});
