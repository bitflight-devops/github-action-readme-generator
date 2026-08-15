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
    # Description: A \| B
    # 
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
    ['absent', undefined, ''],
    ['empty', "''", ''],
    ['false', 'false', 'false'],
    ['zero', '0', '0'],
  ])('accepts the final pretty-on blank comment with an %s default', (_name, yaml, value) => {
    const action =
      yaml === undefined
        ? ACTION
        : ACTION.replace('required: false', `required: false\n    default: ${yaml}`);
    let readme = README.replace('    # \n', '    #\n');
    if (yaml !== undefined) {
      readme = readme.replace(
        '    path: value',
        `    # Default:${value === '' ? '' : ` ${value}`}\n    path: value`,
      );
      if (value !== '') {
        readme = readme.replace(
          String.raw`A \\\| B |  | false`,
          String.raw`A \\\| B | <code>${value}</code> | false`,
        );
      }
    }
    expect(verify(readme, action)).toContain('All contract checks passed');
  });

  it('pairs a section with the final end marker when generated content contains that marker', () => {
    const action = ACTION.replace(
      'description: __bold__',
      "description: 'Before <!-- end description --> After'",
    );
    const readme = README.replace('**bold**', 'Before <!-- end description --> After');
    expect(verify(readme, action)).toContain('All contract checks passed');
  });

  it('validates generated usage descriptions and removed defaults exactly', () => {
    expect(() =>
      verify(README.replace('    # Description: A \\| B', '    # Description: stale')),
    ).toThrow();
    expect(() =>
      verify(
        README.replace('    # \n    path: value', '    # \n    # Default: stale\n    path: value'),
      ),
    ).toThrow();
  });

  it('accepts the generator-wrapped usage description', () => {
    const description =
      'This is a deliberately long description that should wrap across more than one generated usage comment line for exact validation.';
    const action = ACTION.replace(String.raw`A \| B`, description);
    const readme = README.replace(
      '    # Description: A \\| B\n    # ',
      '    # Description: This is a deliberately long description that should wrap across\n    # more than one generated usage comment line for exact validation.\n    # ',
    ).replace(String.raw`A \\\| B`, description);
    expect(verify(readme, action)).toContain('All contract checks passed');
  });

  it('accepts a structured usage description without losing its wrapped blocks', () => {
    const action = ACTION.replace(
      String.raw`description: A \| B`,
      'description: |-\n      Intro.\n\n      - one\n      - two',
    );
    const readme = README.replace(
      '    # Description: A \\| B\n    # ',
      '    # Description: Intro.\n    # \n    # - one\n    # - two\n    # ',
    ).replace(String.raw`A \\\| B`, 'Intro.');
    expect(verify(readme, action)).toContain('All contract checks passed');
  });

  it('matches the generator literal blank-line boundary in table descriptions', () => {
    const action = ACTION.replace(
      String.raw`description: A \| B`,
      'description: "first\\n  \\nsecond"',
    );
    const readme = README.replace(
      '    # Description: A \\| B\n    # ',
      '    # Description: first\n    #\n    # second\n    #',
    ).replace(String.raw`A \\\| B`, 'first<br /> <br />second');
    expect(verify(readme, action)).toContain('All contract checks passed');
  });

  it('validates complete first paragraphs and whitespace-only lines in output descriptions', () => {
    const action = ACTION.replace(
      'runs:',
      'outputs:\n  soft:\n    description: "First\\nSecond\\nThird\\n\\nBody"\n  spaced:\n    description: "first\\n  \\nsecond"\nruns:',
    );
    const outputTable = String.raw`| **Output** | **Description** | **Value** |
|---|---|---|
| <b><code>soft</code></b> | First<br />Second<br />Third |  |
| <b><code>spaced</code></b> | first<br />  <br />second |  |`;
    const readme = README.replace('**bold**', '__bold__').replace(
      '<!-- start outputs -->\n<!-- end outputs -->',
      `<!-- start outputs -->\n${outputTable}\n<!-- end outputs -->`,
    );
    expect(
      verify(readme, action, {
        title_prefix: 'GitHub Action: ',
        branding_as_title_prefix: false,
        prettier: false,
      }),
    ).toContain('All contract checks passed');
  });

  it.each([
    ['a changed header', README.replace('**Input**', '**Argument**')],
    ['a malformed delimiter', README.replace('|---|---|---|---|', '|--|---|---|---|')],
    [
      'an aligned delimiter the generator does not emit',
      README.replace('|---|---|---|---|', '|:---|---|---|---|'),
    ],
    ['a short data row', README.replace(String.raw` |  | false |`, ' |  |')],
  ])('rejects %s in a generated table', (_name, readme) => {
    expect(() => verify(readme)).toThrow();
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
    const readme = README.replace('# GitHub Action: Release', '# GitHub Action: **Release**')
      .replace('    # Description: A \\| B', '    # Description: **bold**')
      .replace(String.raw`A \\\| B`, '**bold**');
    expect(verify(readme, action)).toContain('All contract checks passed');
  });

  it('rejects dropped Markdown syntax in metadata and table descriptions', () => {
    expect(() => verify(README.replace('**bold**', 'bold'))).toThrow();

    const action = ACTION.replace(String.raw`description: A \| B`, "description: '**important**'");
    const readme = README.replace(
      '    # Description: A \\| B',
      '    # Description: **important**',
    ).replace(String.raw`A \\\| B`, 'important');
    expect(() => verify(readme, action)).toThrow();
  });

  it('accepts exact unformatted Markdown when pretty is disabled', () => {
    const action = ACTION.replace('name: Release', 'name: __Release__').replace(
      String.raw`description: A \| B`,
      'description: __bold__',
    );
    const readme = README.replace('# GitHub Action: Release', '# GitHub Action: __Release__')
      .replace('**bold**', '__bold__')
      .replace('    # Description: A \\| B', '    # Description: **bold**')
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
    const readme = README.replace('# GitHub Action: Release', '# GitHub Action: **Release**')
      .replace('    # Description: A \\| B', '    # Description: **bold**')
      .replace(String.raw`A \\\| B`, '**bold**');
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
    const readme = README.replace('**bold**', '__bold__')
      .replace(String.raw`A \\\| B`, String.raw`C:\temp`)
      .replace('    # Description: A \\| B', String.raw`    # Description: C:\temp`);
    expect(
      verify(readme, action, {
        title_prefix: 'GitHub Action: ',
        branding_as_title_prefix: false,
        prettier: false,
      }),
    ).toContain('All contract checks passed');
  });

  it('accepts every newline projected from a multiline table description', () => {
    const action = ACTION.replace(
      String.raw`description: A \| B`,
      'description: |-\n      one\n      two\n      three',
    );
    const readme = README.replace('**bold**', '__bold__')
      .replace('    # Description: A \\| B', '    # Description: one two three')
      .replace(String.raw`A \\\| B`, 'one<br />two<br />three');
    expect(
      verify(readme, action, {
        title_prefix: 'GitHub Action: ',
        branding_as_title_prefix: false,
        prettier: false,
      }),
    ).toContain('All contract checks passed');
  });

  it('preserves syntax-bearing input defaults in usage and table projections', () => {
    const action = ACTION.replace('required: false', "required: false\n    default: 'a **b**'");
    const readme = README.replace(
      '    path: value',
      '    # Default: a **b**\n    path: value',
    ).replace(String.raw`A \\\| B |  | false`, String.raw`A \\\| B | <code>a **b**</code> | false`);
    expect(verify(readme, action)).toContain('All contract checks passed');
    expect(() => verify(readme.replace('# Default: a **b**', '# Default: a b'), action)).toThrow();
    expect(() =>
      verify(readme.replace('<code>a **b**</code>', '<code>a b</code>'), action),
    ).toThrow();
  });

  it.each(['false', '0'])('accepts the declared falsy input default %s', (value) => {
    const action = ACTION.replace('required: false', `required: false\n    default: ${value}`);
    const readme = README.replace(
      '    path: value',
      `    # Default: ${value}\n    path: value`,
    ).replace(
      String.raw`A \\\| B |  | false`,
      String.raw`A \\\| B | <code>${value}</code> | false`,
    );
    expect(verify(readme, action)).toContain('All contract checks passed');
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

  it('validates output values and declaration order', () => {
    const action = ACTION.replace(
      'runs:',
      "outputs:\n  first:\n    description: First result\n    value: ${{ 'a **b**' }}\n  second:\n    description: Second result\n    value: ${{ '<em>x</em>' }}\n  third:\n    description: Third result\nruns:",
    );
    const first = "| <b><code>first</code></b> | First result | <code>${{ 'a **b**' }}</code> |";
    const second =
      "| <b><code>second</code></b> | Second result | <code>${{ '<em>x</em>' }}</code> |";
    const third = '| <b><code>third</code></b> | Third result |  |';
    const table = `| **Output** | **Description** | **Value** |\n|---|---|---|\n${first}\n${second}\n${third}`;
    const readme = README.replace(
      '<!-- start outputs -->\n<!-- end outputs -->',
      `<!-- start outputs -->\n${table}\n<!-- end outputs -->`,
    );

    expect(verify(readme, action)).toContain('All contract checks passed');
    expect(() => verify(readme.replace('a **b**', 'a b'), action)).toThrow();
    expect(() => verify(readme.replace('<em>x</em>', 'x'), action)).toThrow();
    expect(() =>
      verify(readme.replace(third, third.replace('|  |', '| stale |')), action),
    ).toThrow();
    expect(() =>
      verify(readme.replace(`${first}\n${second}`, `${second}\n${first}`), action),
    ).toThrow();
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
