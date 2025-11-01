/* eslint-disable @typescript-eslint/unbound-method */
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as core from '@actions/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ReadmeSection } from '../src/constants.js';
import Inputs from '../src/inputs.js';
import LogTask from '../src/logtask/index.js';
import updateSection from '../src/sections/index.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);
type ReadmeGeneratorInstance = InstanceType<
  typeof import('../src/readme-generator.js').ReadmeGenerator
>;
vi.mock('../src/logtask/index.js');
// Mock the Inputs and LogTask classes
vi.mock('../src/inputs.js');
vi.mock('../src/sections/index.js');
vi.mock('@actions/core');

vi.mock('../src/readme-editor.js');
// Mocking required objects and functions
vi.mock('node:fs', async () => {
  const mockFs = await import('../__mocks__/node:fs.js');
  return mockFs;
});
describe('ReadmeGenerator', () => {
  let mockInputs: Inputs;
  let mockLogTask: LogTask;
  let readmeGenerator: ReadmeGeneratorInstance;

  beforeEach(async () => {
    const { default: ReadmeEditor } = await import('../src/readme-editor.js');
    const { ReadmeGenerator } = await import('../src/readme-generator.js');
    const { default: Inputs } = await import('../src/inputs.js');
    const { default: LogTask } = await import('../src/logtask/index.js');
    mockLogTask = new LogTask('mock');
    mockInputs = new Inputs({}, mockLogTask);
    mockInputs.readmeEditor = new ReadmeEditor('./README.md');

    readmeGenerator = new ReadmeGenerator(mockInputs, mockLogTask);
    vi.mocked(updateSection).mockImplementation(
      async (section: ReadmeSection, inputs: Inputs): Promise<Record<string, string>> => {
        expect(inputs).toBe(mockInputs);
        expect(section).toBeTypeOf('string');
        return { [section]: 'value' };
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updateSection should be mocked', () => {
    expect(updateSection).toBeInstanceOf(Function);
    expect(vi.isMockFunction(updateSection)).toBe(true);
  });
  describe('updateSections', () => {
    it('should call updateSection for each section', async () => {
      const sections: ReadmeSection[] = ['title', 'branding'];

      const sectionUpdates = readmeGenerator.updateSections(sections);
      const result = await Promise.all(sectionUpdates);

      expect(result[0]).toEqual({ title: 'value' });
      expect(result[1]).toEqual({ branding: 'value' });
    });
  });

  describe('resolveUpdates', () => {
    it('should resolve all promises and combine the results', async () => {
      const promises: Promise<Record<string, string>>[] = [
        Promise.resolve({ key1: 'value1' }),
        Promise.resolve({ key2: 'value2' }),
      ];

      const result = await readmeGenerator.resolveUpdates(promises);

      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });
  });

  describe('outputSections', () => {
    it('should output sections if running in GitHub Actions', () => {
      vi.stubEnv('GITHUB_ACTIONS', 'true');
      const sections: Record<string, string> = { key: 'value' };

      readmeGenerator.outputSections(sections);

      expect(mockLogTask.debug).toHaveBeenCalledWith('Outputting sections');
      expect(core.setOutput).toHaveBeenCalledWith('sections', JSON.stringify(sections, null, 2));
    });

    it('should not output sections if not running in GitHub Actions', () => {
      delete process.env.GITHUB_ACTIONS;
      const sections: Record<string, string> = { key: 'value' };

      readmeGenerator.outputSections(sections);

      expect(mockLogTask.debug).toHaveBeenCalledWith('Not outputting sections');
      expect(core.setOutput).not.toHaveBeenCalled();
    });
  });

  describe('generate', () => {
    it('should call updateSections, resolveUpdates, outputSections, and dumpToFile', async () => {
      const sections: ReadmeSection[] = ['title', 'branding'];

      const sectionPromises: Promise<Record<string, string>>[] = [
        Promise.resolve({ title: 'value1' }),
        Promise.resolve({ branding: 'value2' }),
      ];
      const combinedSections: Record<string, string> = { title: 'value1', branding: 'value2' };

      mockInputs.sections = sections;
      expect(vi.isMockFunction(mockInputs.readmeEditor.dumpToFile)).toBe(true);

      readmeGenerator.updateSections = vi.fn().mockReturnValue(sectionPromises);
      readmeGenerator.resolveUpdates = vi.fn().mockResolvedValue(combinedSections);
      readmeGenerator.outputSections = vi.fn();

      await readmeGenerator.generate();

      expect(mockInputs.readmeEditor.dumpToFile).toHaveBeenCalled();
      expect(readmeGenerator.updateSections).toHaveBeenCalledWith(sections);
      expect(readmeGenerator.resolveUpdates).toHaveBeenCalledWith(sectionPromises);
      expect(readmeGenerator.outputSections).toHaveBeenCalledWith(combinedSections);
    });
  });
});
