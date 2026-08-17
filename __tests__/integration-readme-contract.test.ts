/**
 * The contract this tool exists to deliver, asserted end-to-end.
 *
 * Two promises:
 *   1. the whole of action.yml becomes a usage guide, carrying a real version
 *      string — every declared input reaches the `with:` block, along with its
 *      description and its default;
 *   2. every template section between `<!-- start X -->` markers is replaced
 *      with dynamic content derived from action.yml.
 *
 * __tests__/integration-external-repo.test.ts covers owner/repo and version
 * detection. It does not check that inputs reach the guide, that the tables are
 * populated, or that any section other than usage was touched — a run that
 * emitted an empty inputs table would pass it. These cases close that gap, and
 * are driven from a synthetic action.yml whose keys are enumerated from the
 * fixture rather than hardcoded, so adding an input to the fixture extends the
 * assertions with it.
 */
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import YAML from 'yaml';

import Inputs from '../src/inputs.js';
import LogTask from '../src/logtask/index.js';
import { ReadmeGenerator } from '../src/readme-generator.js';

const VERIFIER_SCRIPT = path.resolve('scripts/verify-readme-contract.mjs');

/** Inputs and outputs the generated README has to account for, one per shape. */
const ACTION_YML = `name: Contract Test Action
description: An action whose every input must reach the usage guide
branding:
  icon: book-open
  color: yellow
inputs:
  plain_input:
    description: A plain input with a default
    required: false
    default: 'plain-default'
  required_input:
    description: A required input carrying no default
    required: true
  multiline_input:
    description: |
      A description long enough that prettier has to wrap it across more than one
      line when it is folded into the usage block as a comment.
    required: false
    default: 'multi-default'
  no_default_input:
    description: An optional input with no default at all
    required: false
outputs:
  first_output:
    description: The first output
  second_output:
    description: The second output
runs:
  using: node20
  main: index.js
`;

/** Every marker pair the tool knows how to fill. */
const SECTIONS = [
  'title',
  'branding',
  'description',
  'usage',
  'inputs',
  'outputs',
  'contents',
  'badges',
] as const;

/**
 * The sections built directly from action.yml, which therefore always have
 * content. `contents` and `badges` are conditional — see the tests below.
 */
const ACTION_DERIVED_SECTIONS = [
  'title',
  'branding',
  'description',
  'usage',
  'inputs',
  'outputs',
] as const;

const README_WITH_MARKERS = [
  '# Placeholder',
  '',
  ...SECTIONS.flatMap((section) => [`<!-- start ${section} -->`, `<!-- end ${section} -->`, '']),
].join('\n');

describe('README generation contract', () => {
  let originalCwd: string;
  let tempDir: string;
  let readmePath: string;
  let actionPath: string;

  const actionYml = YAML.parse(ACTION_YML) as {
    inputs: Record<string, { description: string; default?: string }>;
    outputs: Record<string, { description: string }>;
  };
  const inputKeys = Object.keys(actionYml.inputs);
  const outputKeys = Object.keys(actionYml.outputs);

  /** Content between a section's start and end markers. */
  const sectionBody = (readme: string, section: string): string => {
    const match = new RegExp(
      `<!--\\s*start ${section}\\s*-->([\\s\\S]*?)<!--\\s*end ${section}\\s*-->`,
    ).exec(readme);
    return match?.[1]?.trim() ?? '';
  };

  const generate = async (pretty = true): Promise<string> => {
    vi.stubEnv('GITHUB_REPOSITORY', '');
    vi.stubEnv('GITHUB_EVENT_PATH', '');
    vi.stubEnv('INPUT_OWNER', 'contract-owner');
    vi.stubEnv('INPUT_REPO', 'contract-repo');
    vi.stubEnv('INPUT_ACTION', actionPath);
    vi.stubEnv('INPUT_README', readmePath);
    vi.stubEnv('INPUT_PRETTY', String(pretty));

    const log = new LogTask('contract');
    const inputs = new Inputs({ configPath: path.join(tempDir, '.ghadocs.json') }, log);
    await new ReadmeGenerator(inputs, log).generate();

    return fs.readFileSync(readmePath, 'utf8');
  };

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-contract-'));
    process.chdir(tempDir);

    actionPath = path.join(tempDir, 'action.yml');
    readmePath = path.join(tempDir, 'README.md');
    fs.writeFileSync(actionPath, ACTION_YML);
    fs.writeFileSync(readmePath, README_WITH_MARKERS);

    fs.mkdirSync(path.join(tempDir, '.git'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, '.git', 'config'),
      '[remote "origin"]\n\turl = https://github.com/contract-owner/contract-repo.git\n',
    );
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'contract-action', version: '9.8.7' }, null, 2),
    );
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  describe('the whole action.yml becomes a usage guide', () => {
    it('carries a real version string, not a placeholder', async () => {
      const usage = sectionBody(await generate(), 'usage');

      expect(usage).toContain('- uses: contract-owner/contract-repo@v9.8.7');
      expect(usage).not.toMatch(/@(undefined|null|v?0\.0\.0)\b/);
      expect(usage).not.toContain('uses: /@');
    });

    it('is a fenced yaml block with a with: mapping', async () => {
      const usage = sectionBody(await generate(), 'usage');

      expect(usage).toMatch(/^```yaml/);
      expect(usage).toContain('  with:');
      expect(usage.trimEnd()).toMatch(/```$/);
    });

    // The promise is the *whole* action.yml, so this enumerates the fixture
    // rather than naming inputs — a fixture input that never reaches the guide
    // fails here instead of going unnoticed.
    // The source emits `key: ''`, but prettier's yaml plugin normalises the
    // quotes to `key: ""` when it formats the embedded fence — so match the key
    // and an empty value of either quote style.
    it.each(inputKeys)('includes the %s input in the with: block', async (key) => {
      const usage = sectionBody(await generate(), 'usage');

      expect(usage).toMatch(new RegExp(`^\\s*${key}: (''|"")$`, 'm'));
    });

    it.each(inputKeys)('carries the description for %s', async (key) => {
      const usage = sectionBody(await generate(), 'usage');
      // Descriptions are prose-wrapped, so match the opening words rather than
      // the whole string.
      const opening = actionYml.inputs[key].description.trim().split(/\s+/).slice(0, 4).join(' ');

      expect(usage.replaceAll(/\n\s*#\s*/g, ' ')).toContain(opening);
    });

    it.each(inputKeys.filter((key) => actionYml.inputs[key].default !== undefined))(
      'carries the default for %s',
      async (key) => {
        const usage = sectionBody(await generate(), 'usage');

        expect(usage).toContain(`Default: ${actionYml.inputs[key].default}`);
      },
    );

    it('omits a Default line for an input that declares none', async () => {
      const usage = sectionBody(await generate(), 'usage');
      const block = usage.slice(usage.indexOf('no_default_input'));

      expect(block).not.toContain('Default:');
    });
  });

  describe('every template section receives dynamic content', () => {
    // Only the sections derived unconditionally from action.yml are asserted
    // here. `contents` indexes the README's own headings, so it is empty for a
    // document with none to index, and `badges` depends on the versioning
    // config rather than on action.yml — both are covered separately below.
    it.each(ACTION_DERIVED_SECTIONS)('fills the %s section', async (section) => {
      const body = sectionBody(await generate(), section);

      expect(body).not.toBe('');
    });

    it('takes the title from action.yml', async () => {
      expect(sectionBody(await generate(), 'title')).toContain('Contract Test Action');
    });

    it('takes the description from action.yml', async () => {
      expect(sectionBody(await generate(), 'description')).toContain(
        'every input must reach the usage guide',
      );
    });

    it.each(inputKeys)('lists the %s input in the inputs table', async (key) => {
      expect(sectionBody(await generate(), 'inputs')).toContain(key);
    });

    it.each(outputKeys)('lists the %s output in the outputs table', async (key) => {
      expect(sectionBody(await generate(), 'outputs')).toContain(key);
    });

    it('ignores leading blank lines before selecting input and output table paragraphs', async () => {
      const action = ACTION_YML.replace(
        'description: A plain input with a default',
        'description: "\\n\\nActual input\\nSecond input line\\n\\nInput body"',
      ).replace(
        'description: The first output',
        'description: "\\n\\nActual output\\nSecond output line\\n\\nOutput body"',
      );
      fs.writeFileSync(actionPath, action);

      const readme = await generate(false);
      const inputs = sectionBody(readme, 'inputs');
      const outputs = sectionBody(readme, 'outputs');
      expect(inputs).toContain('Actual input<br />Second input line');
      expect(inputs).not.toContain('Input body');
      expect(outputs).toContain('Actual output<br />Second output line');
      expect(outputs).not.toContain('Output body');
    });

    it('removes stale output rows when action.yml declares no outputs', async () => {
      fs.writeFileSync(actionPath, ACTION_YML.replace(/outputs:[\s\S]*?runs:/, 'runs:'));
      // oxfmt-ignore
      const staleReadme = README_WITH_MARKERS.replace('<!-- start outputs -->', '<!-- start outputs -->\n| **Output** | **Description** |\n|---|---|\n| stale | old |');
      fs.writeFileSync(readmePath, staleReadme);

      expect(sectionBody(await generate(), 'outputs')).toBe('');
    });

    it.each([
      ['omitted', ACTION_YML.replace(/inputs:[\s\S]*?outputs:/, 'outputs:')],
      ['empty', ACTION_YML.replace(/inputs:[\s\S]*?outputs:/, 'inputs: {}\noutputs:')],
    ])('removes stale input rows when action.yml inputs are %s', async (_shape, action) => {
      fs.writeFileSync(actionPath, action);
      // oxfmt-ignore
      const staleReadme = README_WITH_MARKERS.replace('<!-- start inputs -->', '<!-- start inputs -->\n| **Input** | **Description** | **Default** | **Required** |\n|---|---|---|---|\n| stale | old |  | false |');
      fs.writeFileSync(readmePath, staleReadme);

      expect(sectionBody(await generate(), 'inputs')).toBe('');
    });

    it('keeps complete first paragraphs and treats only literal blank lines as boundaries', async () => {
      const action = ACTION_YML.replace(
        'description: A plain input with a default',
        'description: "First\\nSecond\\nThird\\n\\nInput body"',
      )
        .replace(
          'description: A required input carrying no default',
          'description: "input first\\n  \\ninput second"',
        )
        .replace(
          'description: The first output',
          'description: "Output first\\nOutput second\\nOutput third\\n\\nOutput body"',
        )
        .replace(
          'description: The second output',
          'description: "output first\\n  \\noutput second"',
        );
      fs.writeFileSync(actionPath, action);

      const readme = await generate(false);
      const inputs = sectionBody(readme, 'inputs');
      const outputs = sectionBody(readme, 'outputs');
      expect(inputs).toContain('First<br />Second<br />Third');
      expect(inputs).not.toContain('Input body');
      expect(inputs).toContain('input first<br />  <br />input second');
      expect(outputs).toContain('Output first<br />Output second<br />Output third');
      expect(outputs).not.toContain('Output body');
      expect(outputs).toContain('output first<br />  <br />output second');
    });

    // contents is a table of contents over the README's own headings, so it
    // stays empty until the document has headings to index. Pinning both halves
    // keeps "empty" from being mistaken for "broken".
    it('leaves contents empty when the README has no headings to index', async () => {
      expect(sectionBody(await generate(), 'contents')).toBe('');
    });

    it('fills contents once the README has headings', async () => {
      fs.writeFileSync(
        readmePath,
        `${README_WITH_MARKERS}\n## First Heading\n\ntext\n\n## Second Heading\n\nmore\n`,
      );

      const contents = sectionBody(await generate(), 'contents');

      expect(contents).toContain('First Heading');
      expect(contents).toContain('Second Heading');
    });
  });

  describe('layout', () => {
    // src/markdowner emits `|---|---|`; prettier pads the columns. Asserting the
    // padding is what catches the formatter silently not running.
    //
    // This works *here* only because the fixture README starts as bare markers
    // with no tables, so any padding in the output was produced by this run. The
    // same assertion is not valid against a third-party repository — its README
    // may already be prettier-formatted by its own tooling, so padding would
    // prove nothing about whether this tool's formatter ran. Do not lift these
    // two cases into scripts/verify-readme-contract.mjs.
    it('pads table columns when pretty is on', async () => {
      const inputsTable = sectionBody(await generate(true), 'inputs');

      expect(inputsTable).toMatch(/\| -{3,} \|/);
      expect(inputsTable).not.toMatch(/\|-{3,}\|/);
    });

    it('leaves the table unpadded when pretty is off', async () => {
      const inputsTable = sectionBody(await generate(false), 'inputs');

      expect(inputsTable).toMatch(/\|-{3,}\|/);
    });

    // Passes 2 and 3, never 1 and 2 — `docs/tool-contract.md` explains why
    // `updateContents` can leave pass 1 indexing the previous usage block.
    // This fixture happens to settle on pass 1, so a 1-vs-2 assertion passes
    // here and would encode the wrong rule for the first fixture that gains a
    // contents section.
    it('is idempotent — generation reaches a fixed point', async () => {
      await generate();
      const second = await generate();
      const third = await generate();

      expect(third).toBe(second);
    });

    it('passes the exact verifier after contents and badges converge', async () => {
      const originalReadme = `${README_WITH_MARKERS}\n## First Heading\n\n### Child Heading\n`;
      const originalReadmePath = path.join(tempDir, 'README.original.md');
      fs.writeFileSync(readmePath, originalReadme);
      fs.writeFileSync(originalReadmePath, originalReadme);
      fs.writeFileSync(
        path.join(tempDir, '.ghadocs.json'),
        JSON.stringify({
          owner: 'contract-owner',
          repo: 'contract-repo',
          title_prefix: 'GitHub Action: ',
          branding_svg_path: '.github/ghadocs/branding.svg',
          branding_as_title_prefix: false,
          versioning: { badge: true },
        }),
      );

      await generate();
      await generate();
      const finalReadme = await generate();

      expect(sectionBody(finalReadme, 'contents')).toContain('[First Heading](#first-heading)');
      expect(sectionBody(finalReadme, 'badges')).toContain(
        'img.shields.io/github/v/release/contract-owner/contract-repo',
      );
      const verification = spawnSync(
        process.execPath,
        [
          VERIFIER_SCRIPT,
          actionPath,
          readmePath,
          originalReadmePath,
          'contract-owner/contract-repo',
        ],
        { cwd: tempDir, encoding: 'utf8' },
      );
      expect(verification.status, `${verification.stdout}\n${verification.stderr}`).toBe(0);
      expect(verification.stdout).toContain('All contract checks passed');
    });
  });
});
