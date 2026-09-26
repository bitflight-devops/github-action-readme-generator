import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it, vi } from 'vite-plus/test';

import { GHActionDocsConfig } from '../src/config.js';
import type Inputs from '../src/inputs.js';
import ReadmeEditor from '../src/readme-editor.js';
import updateBranding, { generateImgMarkup } from '../src/sections/update-branding.js';
import updateTitle from '../src/sections/update-title.js';
import SVGEditor from '../src/svg-editor.mjs';

describe('branding generation', () => {
  it('generates the branding SVG on the first run', async () => {
    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ghadocs-branding-'));
    const svgPath = path.join(tempDirectory, 'branding.svg');
    const values = new Map<string, unknown>([['branding_svg_path', svgPath]]);
    const inputs = {
      action: { branding: { icon: 'book-open', color: 'yellow' } },
      config: {
        get: vi.fn((key: string) => values.get(key)),
        set: vi.fn((key: string, value: unknown) => values.set(key, value)),
      },
    } as unknown as Inputs;
    try {
      generateImgMarkup(inputs);

      await vi.waitFor(() => expect(fs.readFileSync(svgPath, 'utf8')).toContain('<svg'));
      expect(inputs.config.set).toHaveBeenCalledWith('image_generated', 'book-openyellow');
    } finally {
      fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
  });

  it('retains the generated image hash when saving configuration', async () => {
    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ghadocs-config-'));
    const configPath = path.join(tempDirectory, '.ghadocs.json');
    const docsConfig = new GHActionDocsConfig();
    const inputs = {
      config: {
        get: vi.fn(() => ({
          branding_svg_path: '.github/ghadocs/branding.svg',
          image_generated: 'book-openyellow',
        })),
      },
    } as unknown as Inputs;

    try {
      docsConfig.loadInputs(inputs);
      await docsConfig.save(configPath);

      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<
        string,
        unknown
      >;
      expect(savedConfig.image_generated).toBe('book-openyellow');
    } finally {
      fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
  });

  it('does not regenerate branding when the saved hash still matches', () => {
    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ghadocs-branding-'));
    const svgPath = path.join(tempDirectory, 'branding.svg');
    fs.writeFileSync(svgPath, '<svg />');
    const values = new Map<string, unknown>([
      ['branding_svg_path', svgPath],
      ['image_generated', 'book-openyellow'],
    ]);
    const inputs = {
      action: { branding: { icon: 'book-open', color: 'yellow' } },
      config: {
        get: vi.fn((key: string) => values.get(key)),
        set: vi.fn((key: string, value: unknown) => values.set(key, value)),
      },
    } as unknown as Inputs;
    const generateSvgImage = vi.spyOn(SVGEditor.prototype, 'generateSvgImage');

    try {
      generateImgMarkup(inputs);

      expect(generateSvgImage).not.toHaveBeenCalled();
      expect(inputs.config.set).not.toHaveBeenCalled();
    } finally {
      generateSvgImage.mockRestore();
      fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
  });

  it('regenerates branding when the saved hash matches but the destination is missing', () => {
    const values = new Map<string, unknown>([
      ['branding_svg_path', '.github/ghadocs/moved-branding.svg'],
      ['image_generated', 'book-openyellow'],
    ]);
    const inputs = {
      action: { branding: { icon: 'book-open', color: 'yellow' } },
      config: {
        get: vi.fn((key: string) => values.get(key)),
        set: vi.fn((key: string, value: unknown) => values.set(key, value)),
      },
    } as unknown as Inputs;
    const generateSvgImage = vi
      .spyOn(SVGEditor.prototype, 'generateSvgImage')
      .mockImplementation(() => undefined);

    try {
      generateImgMarkup(inputs);

      expect(generateSvgImage).toHaveBeenCalledWith(
        '.github/ghadocs/moved-branding.svg',
        'book-open',
        'yellow',
      );
      expect(inputs.config.set).toHaveBeenCalledWith('image_generated', 'book-openyellow');
    } finally {
      generateSvgImage.mockRestore();
    }
  });

  // #695: every configured section is generated for the `sections` output,
  // but the image file is written only where a section shows it.
  describe('when the README does not show the image', () => {
    const run = (
      readme: string,
      update: (inputs: Inputs) => Record<string, string>,
    ): { content: string; written: boolean } => {
      const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ghadocs-branding-'));
      const readmePath = path.join(tempDirectory, 'README.md');
      fs.writeFileSync(readmePath, readme);
      const values = new Map<string, unknown>([
        ['branding_svg_path', path.join(tempDirectory, 'branding.svg')],
        ['branding_as_title_prefix', true],
        ['title_prefix', ''],
      ]);
      const inputs = {
        action: { name: 'Action', branding: { icon: 'book-open', color: 'yellow' } },
        config: {
          get: vi.fn((key: string) => values.get(key)),
          set: vi.fn((key: string, value: unknown) => values.set(key, value)),
        },
        readmeEditor: new ReadmeEditor(readmePath),
      } as unknown as Inputs;
      const generateSvgImage = vi
        .spyOn(SVGEditor.prototype, 'generateSvgImage')
        .mockImplementation(() => undefined);
      try {
        const content = Object.values(update(inputs)).join('');
        return { content, written: generateSvgImage.mock.calls.length > 0 };
      } finally {
        generateSvgImage.mockRestore();
        fs.rmSync(tempDirectory, { recursive: true, force: true });
      }
    };

    it.each([
      ['branding', (inputs: Inputs) => updateBranding('branding', inputs)],
      ['title', (inputs: Inputs) => updateTitle('title', inputs)],
    ])('the %s section still returns its markup but writes no image', (_name, update) => {
      const { content, written } = run('# README\n', update);

      expect(content).toContain('<img');
      expect(written).toBe(false);
    });

    it.each([
      ['branding', (inputs: Inputs) => updateBranding('branding', inputs)],
      ['title', (inputs: Inputs) => updateTitle('title', inputs)],
    ])('the %s section writes the image when the README has its markers', (name, update) => {
      const { written } = run(`<!-- start ${name} -->\n<!-- end ${name} -->\n`, update);

      expect(written).toBe(true);
    });
  });
});
