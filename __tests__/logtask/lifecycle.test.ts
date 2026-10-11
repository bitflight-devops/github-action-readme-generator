import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import * as core from '@actions/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { README_SECTIONS, type ReadmeSection } from '../../src/constants.js';
import Inputs from '../../src/inputs.js';
import LogTask from '../../src/logtask/index.js';
import * as prettier from '../../src/prettier.js';
import ReadmeEditor from '../../src/readme-editor.js';
import { ReadmeGenerator, type SectionKV } from '../../src/readme-generator.js';
import updateSection from '../../src/sections/index.js';
import updateUsage from '../../src/sections/update-usage.js';
import SVGEditor from '../../src/svg-editor.mjs';

vi.mock('@actions/core', { spy: true });

const ACTION = `name: Logger lifecycle action
description: Action description
branding:
  icon: book-open
  color: yellow
inputs:
  token:
    description: Token description
    default: example
outputs:
  result:
    description: Result description
runs:
  using: node24
  main: index.js
`;

const README = [
  '# Maintained title',
  '',
  '* Hand-written prose   ',
  '',
  ...README_SECTIONS.flatMap((section) => [
    `<!-- start ${section} -->`,
    'stale',
    `<!-- end ${section} -->`,
    '',
  ]),
  '## Maintained footer',
  '',
].join('\n');

describe('section log group lifecycle', () => {
  let directory: string;
  let readmePath: string;
  let svgPath: string;
  let configPath: string;
  let commands: string[];

  const loadInputs = (sections: ReadmeSection[] = [...README_SECTIONS]): Inputs =>
    new Inputs({ configPath, sections });

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ghadocs-log-groups-'));
    readmePath = path.join(directory, 'README.md');
    svgPath = path.join(directory, 'branding.svg');
    configPath = path.join(directory, '.ghadocs.json');
    const actionPath = path.join(directory, 'action.yml');
    fs.writeFileSync(actionPath, ACTION);
    fs.writeFileSync(readmePath, README);
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        owner: 'fixture-owner',
        repo: 'fixture-action',
        paths: { action: actionPath, readme: readmePath },
        title_prefix: '',
        branding_svg_path: svgPath,
        branding_as_title_prefix: false,
        image_generated: 'boxblue',
        prettier: false,
        versioning: {
          enabled: true,
          source: 'explicit',
          override: '1.2.3',
          prefix: 'v',
          badge: true,
        },
      }),
    );
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    vi.stubEnv('DEBUG', 'false');
    commands = [];
    vi.spyOn(core, 'startGroup').mockImplementation((name) => {
      commands.push(`start:${name}`);
    });
    vi.spyOn(core, 'endGroup').mockImplementation(() => {
      commands.push('end');
    });
    vi.spyOn(core, 'info').mockImplementation(() => {});
    vi.spyOn(core, 'error').mockImplementation(() => {});
    vi.spyOn(core, 'setOutput').mockImplementation(() => {});
    vi.spyOn(core, 'setFailed').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('leaves the caller group open when loading a missing README fails', () => {
    core.startGroup('caller');
    const missing = path.join(directory, 'missing.md');

    expect(() => new ReadmeEditor(missing)).toThrow(expect.objectContaining({ code: 'ENOENT' }));

    expect(commands).toEqual(['start:caller']);
    expect(core.setFailed).toHaveBeenCalledWith(expect.stringContaining(missing));
  });

  it.each<ReadmeSection>([
    'title',
    'branding',
    'description',
    'inputs',
    'outputs',
    'contents',
    'badges',
  ])('closes %s synchronously when its README renderer throws', async (section) => {
    const inputs = loadInputs();
    const failure = new Error('README rendering failed');
    vi.spyOn(inputs.readmeEditor, 'updateSection').mockImplementation(() => {
      throw failure;
    });

    const update = updateSection(section, inputs);
    const commandsAtReturn = [...commands];

    await expect(update).rejects.toBe(failure);
    expect(commandsAtReturn).toEqual([`start:Starting ${section}...`, 'end']);
    expect(fs.readFileSync(readmePath, 'utf8')).toBe(README);
  });

  it('closes branding after a native write failure before pending usage finishes, without caching or saving', async () => {
    fs.mkdirSync(svgPath);
    const inputs = loadInputs(['usage', 'branding']);
    const cachedImage = inputs.config.get('image_generated');
    const writeSVGFile = SVGEditor.prototype.writeSVGFile;
    let nativeFailure: unknown;
    vi.spyOn(SVGEditor.prototype, 'writeSVGFile').mockImplementation(function (
      this: SVGEditor,
      target,
      content,
    ) {
      try {
        writeSVGFile.call(this, target, content);
      } catch (error) {
        nativeFailure = error;
        throw error;
      }
    });

    const generator = new ReadmeGenerator(inputs, new LogTask('generator'));
    const updateSections = generator.updateSections.bind(generator);
    let updates: Promise<SectionKV>[] = [];
    vi.spyOn(generator, 'updateSections').mockImplementation((sections) => {
      updates = updateSections(sections);
      return updates;
    });
    const generation = generator.generate();

    await expect(generation).rejects.toBe(nativeFailure);
    // Promise.all rejects before other eagerly started sections necessarily finish.
    await Promise.allSettled(updates);
    expect(nativeFailure).toMatchObject({ code: 'EISDIR', path: svgPath });
    expect(commands).toEqual([
      'start:Starting branding...',
      'end',
      'start:Starting usage...',
      'end',
    ]);
    expect(inputs.config.get('image_generated')).toBe(cachedImage);
    expect(fs.readFileSync(readmePath, 'utf8')).toBe(README);
  });

  it('preserves an async formatting rejection without opening or ending a group', async () => {
    const inputs = loadInputs(['usage']);
    const failure = new Error('Description formatting failed');
    vi.spyOn(prettier, 'wrapDescription').mockRejectedValue(failure);

    await expect(updateUsage('usage', inputs)).rejects.toBe(failure);

    expect(commands).toEqual([]);
    expect(fs.readFileSync(readmePath, 'utf8')).toBe(README);
  });

  it('closes usage when its renderer throws after description preparation', async () => {
    const inputs = loadInputs(['usage']);
    const failure = new Error('Usage rendering failed');
    vi.spyOn(inputs.readmeEditor, 'updateSection').mockImplementation(() => {
      throw failure;
    });

    await expect(updateUsage('usage', inputs)).rejects.toBe(failure);

    expect(commands).toEqual(['start:Starting usage...', 'end']);
    expect(fs.readFileSync(readmePath, 'utf8')).toBe(README);
  });

  it('prepares duplicate usage sections concurrently and closes each render group before the next', async () => {
    const inputs = loadInputs(['usage', 'usage']);
    const generator = new ReadmeGenerator(inputs, new LogTask('generator'));
    const preparation = Promise.withResolvers<void>();
    const wrapDescription = prettier.wrapDescription;
    const wrapping = vi.spyOn(prettier, 'wrapDescription').mockImplementation(async (...args) => {
      await preparation.promise;
      return wrapDescription(...args);
    });

    const generation = generator.generate();
    const callsBeforeResolution = wrapping.mock.calls.length;
    const commandsBeforeResolution = [...commands];

    preparation.resolve();
    await generation;

    expect(callsBeforeResolution).toBe(2);
    expect(commandsBeforeResolution).toEqual([]);
    expect(commands).toEqual(['start:Starting usage...', 'end', 'start:Starting usage...', 'end']);
    const readme = fs.readFileSync(readmePath, 'utf8');
    expect(readme).toContain('- uses: fixture-owner/fixture-action@v1.2.3');
    expect(readme).toContain('    # Description: Token description');
    expect(readme).toContain('    # Default: example');
    expect(readme).toContain("    token: ''");
    expect(readme.split('<!-- start usage -->')[0]).toBe(README.split('<!-- start usage -->')[0]);
    expect(readme.split('<!-- end usage -->')[1]).toBe(README.split('<!-- end usage -->')[1]);
  });

  it('publishes the existing output contract when GITHUB_ACTIONS=true', async () => {
    const inputs = loadInputs(['description']);
    const expectedReadme = README.replace(
      '<!-- start description -->\nstale\n<!-- end description -->',
      '<!-- start description -->\n\nAction description\n\n<!-- end description -->',
    );

    await new ReadmeGenerator(inputs, new LogTask('generator')).generate();

    const outputs = new Map<string, unknown>(vi.mocked(core.setOutput).mock.calls);
    expect([...outputs.keys()]).toEqual(['readme_before', 'readme', 'sections', 'readme_after']);
    expect(outputs.get('readme_before')).toBe(README);
    expect(outputs.get('readme')).toBe(readmePath);
    expect(JSON.parse(String(outputs.get('sections')))).toEqual({
      description: 'Action description',
    });
    expect(outputs.get('readme_after')).toBe(expectedReadme);
    expect(fs.readFileSync(readmePath, 'utf8')).toBe(expectedReadme);
  });

  it.each(['false', undefined])(
    'emits no workflow groups or outputs with GITHUB_ACTIONS=%s',
    async (value) => {
      vi.stubEnv('GITHUB_ACTIONS', value);
      const inputs = loadInputs(['usage', 'branding']);

      await new ReadmeGenerator(inputs, new LogTask('generator')).generate();

      expect(commands).toEqual([]);
      expect(core.setOutput).not.toHaveBeenCalled();
      expect(fs.readFileSync(svgPath, 'utf8').trim()).toMatch(/<\/svg>$/);
    },
  );
});
