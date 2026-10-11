import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { GHActionDocsConfig } from '../src/config.js';
import type Inputs from '../src/inputs.js';
import LogTask from '../src/logtask/index.js';
import save from '../src/save.js';

function inputsWithSave(saveEnabled: boolean, configPath: string): Inputs {
  const config = {
    owner: 'fixture-owner',
    repo: 'fixture-repo',
    save: saveEnabled,
  };

  return {
    config: { get: vi.fn(() => config) },
    configPath,
  } as unknown as Inputs;
}

describe('save', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('persists the resolved config when save is enabled', async () => {
    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ghadocs-save-'));
    const configPath = path.join(tempDirectory, '.ghadocs.json');

    try {
      await save(inputsWithSave(true, configPath), new LogTask('save-test'));

      expect(JSON.parse(fs.readFileSync(configPath, 'utf8'))).toMatchObject({
        owner: 'fixture-owner',
        repo: 'fixture-repo',
      });
    } finally {
      fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
  });

  it('rejects with the original persistence error when save is enabled', async () => {
    const failure = new Error('config persistence failed');
    const persist = vi.spyOn(GHActionDocsConfig.prototype, 'save').mockRejectedValue(failure);
    const configPath = path.join(os.tmpdir(), 'ghadocs-save-failure', '.ghadocs.json');

    await expect(save(inputsWithSave(true, configPath), new LogTask('save-test'))).rejects.toBe(
      failure,
    );
    expect(persist).toHaveBeenCalledWith(configPath);
  });

  it('does not attempt persistence when save is disabled', async () => {
    const persist = vi.spyOn(GHActionDocsConfig.prototype, 'save');

    await save(
      inputsWithSave(false, path.join(os.tmpdir(), 'ghadocs-save-disabled', '.ghadocs.json')),
      new LogTask('save-test'),
    );

    expect(persist).not.toHaveBeenCalled();
  });
});
