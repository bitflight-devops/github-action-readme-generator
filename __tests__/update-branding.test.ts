import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it, vi } from 'vite-plus/test';

import { GHActionDocsConfig } from '../src/config.js';
import type Inputs from '../src/inputs.js';
import { generateImgMarkup } from '../src/sections/update-branding.js';
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
});
