import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

const SCRIPT = path.resolve('scripts/verify-readme-contract.mjs');
const temporaryDirectories: string[] = [];

const ACTION = String.raw`name: Release
description: __bold__
branding:
  icon: file
  color: blue
inputs:
  path:
    description: A \| B
    required: false
runs:
  using: node20
  main: index.js
`;

const README =
  String.raw`<!-- start title -->
# GitHub Action: Release
<!-- end title -->
<!-- start description -->
**bold**
<!-- end description -->
<!-- start branding -->
<img src=".github/ghadocs/branding.svg" width="15%" align="center" alt="branding<icon:file color:blue>" />
<!-- end branding -->
<!-- start usage -->
` +
  '```yaml\n' +
  String.raw`- uses: owner/repo@v1
  with:
    path: value
` +
  '```\n' +
  String.raw`
<!-- end usage -->
<!-- start inputs -->
| **Input** | **Description** | **Default** | **Required** |
|---|---|---|---|
| <b><code>path</code></b> | A \\\| B |  | false |
<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
`;

const verify = (
  readme = README,
  action = ACTION,
  config: Record<string, unknown> = {
    title_prefix: 'GitHub Action: ',
    branding_as_title_prefix: false,
  },
  readmeDirectory = '.',
): string => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ghadocs-contract-verifier-'));
  temporaryDirectories.push(directory);
  const actionPath = path.join(directory, 'action.yml');
  const readmeParent = path.join(directory, readmeDirectory);
  fs.mkdirSync(readmeParent, { recursive: true });
  const readmePath = path.join(readmeParent, 'README.md');
  fs.writeFileSync(actionPath, action);
  fs.writeFileSync(readmePath, readme);
  fs.writeFileSync(path.join(directory, '.ghadocs.json'), JSON.stringify(config));
  return execFileSync(process.execPath, [SCRIPT, actionPath, readmePath], {
    encoding: 'utf8',
    cwd: directory,
  });
};

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('README contract verifier regressions', () => {
  it('accepts generator-equivalent Markdown and preserves a literal backslash before a pipe', () => {
    expect(verify()).toContain('All contract checks passed');
  });

  it.each([
    [
      'a stale leading word in the title',
      README.replace('# GitHub Action: Release', '# GitHub Action: Legacy Release'),
    ],
    [
      'a branding icon prefix collision',
      README.replace('icon:file color:blue', 'icon:file-plus color:blue'),
    ],
    [
      'a stale zero-entry output row',
      README.replace('<!-- end outputs -->', '| old | stale | value |\n<!-- end outputs -->'),
    ],
    [
      'an undeclared usage input',
      README.replace('    path: value', '    path: value\n    removed: stale'),
    ],
    [
      'an undeclared table row',
      README.replace('<!-- end inputs -->', '| removed | stale |  | false |\n<!-- end inputs -->'),
    ],
    [
      'a stale branding image path',
      README.replace('.github/ghadocs/branding.svg', '.github/ghadocs/old.svg'),
    ],
  ])('rejects %s', (_name, readme) => {
    expect(() => verify(readme)).toThrow();
  });

  it('reads configuration from the generator working directory for nested READMEs', () => {
    const readme = README.replace('# GitHub Action: Release', '# Custom: Release');
    expect(
      verify(readme, ACTION, { title_prefix: 'Custom: ', branding_as_title_prefix: false }, 'docs'),
    ).toContain('All contract checks passed');
  });

  it('canonicalizes equivalent Markdown in titles and table descriptions', () => {
    const action = ACTION.replace('name: Release', 'name: __Release__').replace(
      String.raw`description: A \| B`,
      'description: __bold__',
    );
    const readme = README.replace(
      '# GitHub Action: Release',
      '# GitHub Action: **Release**',
    ).replace(String.raw`A \\\| B`, '**bold**');
    expect(verify(readme, action)).toContain('All contract checks passed');
  });

  it('accepts exact unformatted Markdown when pretty is disabled', () => {
    const action = ACTION.replace('name: Release', 'name: __Release__').replace(
      String.raw`description: A \| B`,
      'description: __bold__',
    );
    const readme = README.replace('# GitHub Action: Release', '# GitHub Action: __Release__')
      .replace('**bold**', '__bold__')
      .replace(String.raw`A \\\| B`, '__bold__');
    expect(
      verify(readme, action, {
        title_prefix: 'GitHub Action: ',
        branding_as_title_prefix: false,
        prettier: false,
      }),
    ).toContain('All contract checks passed');
  });

  it('rejects formatted Markdown that the disabled formatter would not emit', () => {
    const action = ACTION.replace('name: Release', 'name: __Release__').replace(
      String.raw`description: A \| B`,
      'description: __bold__',
    );
    const readme = README.replace(
      '# GitHub Action: Release',
      '# GitHub Action: **Release**',
    ).replace(String.raw`A \\\| B`, '**bold**');
    expect(() =>
      verify(readme, action, {
        title_prefix: 'GitHub Action: ',
        branding_as_title_prefix: false,
        prettier: false,
      }),
    ).toThrow();
  });

  it('rejects an even-backslash pipe that splits an unformatted table row', () => {
    const readme = README.replace('**bold**', '__bold__').replace(
      String.raw`A \\\| B`,
      String.raw`A \\| B`,
    );
    expect(() =>
      verify(readme, ACTION, {
        title_prefix: 'GitHub Action: ',
        branding_as_title_prefix: false,
        prettier: false,
      }),
    ).toThrow();
  });

  it('accepts an ordinary table-cell backslash left unchanged by the generator', () => {
    const action = ACTION.replace(
      String.raw`description: A \| B`,
      String.raw`description: 'C:\temp'`,
    );
    const readme = README.replace('**bold**', '__bold__').replace(
      String.raw`A \\\| B`,
      String.raw`C:\temp`,
    );
    expect(
      verify(readme, action, {
        title_prefix: 'GitHub Action: ',
        branding_as_title_prefix: false,
        prettier: false,
      }),
    ).toContain('All contract checks passed');
  });

  it('rejects an invented space after a title prefix that has none', () => {
    const readme = README.replace('# GitHub Action: Release', '# Custom: Release');
    expect(() =>
      verify(readme, ACTION, { title_prefix: 'Custom:', branding_as_title_prefix: false }),
    ).toThrow();
  });

  it('rejects a stale inline branding image when no branding section exists', () => {
    const readme = README.replace(
      '# GitHub Action: Release',
      '# <img src="old.svg" width="60px" align="center" alt="branding<icon:file color:blue>" /> GitHub Action: Release',
    ).replace(
      '<!-- start branding -->\n<img src=".github/ghadocs/branding.svg" width="15%" align="center" alt="branding<icon:file color:blue>" />\n<!-- end branding -->\n',
      '',
    );
    expect(() =>
      verify(readme, ACTION, {
        title_prefix: 'GitHub Action: ',
        branding_as_title_prefix: true,
      }),
    ).toThrow();
  });

  it('rejects an undeclared usage key when the action has no inputs', () => {
    const action = ACTION.replace(/inputs:\n[\s\S]*?runs:/, 'runs:');
    const readme = README.replace('    path: value', '    removed: stale').replace(
      /<!-- start inputs -->[\s\S]*?<!-- end inputs -->/,
      '<!-- start inputs -->\n<!-- end inputs -->',
    );
    expect(() => verify(readme, action)).toThrow();
  });

  it('rejects a duplicate row when declarations remain', () => {
    const row = String.raw`| <b><code>path</code></b> | A \\\| B |  | false |`;
    const readme = README.replace('<!-- end inputs -->', `${row}\n<!-- end inputs -->`);
    expect(() => verify(readme)).toThrow();
  });

  it('uses the generator plugin set and leaves unsupported fenced JavaScript unchanged', () => {
    const action = ACTION.replace(
      'description: __bold__',
      'description: |-\n  Intro\n  ```javascript\n  const x={a:1}\n  ```',
    );
    const readme = README.replace('**bold**', 'Intro\n\n```javascript\nconst x={a:1}\n```');
    expect(verify(readme, action)).toContain('All contract checks passed');
  });
});
