import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vite-plus/test';
import YAML from 'yaml';

const repositoryDir = path.resolve(import.meta.dirname, '..');
const packageManifest = JSON.parse(
  fs.readFileSync(path.join(repositoryDir, 'package.json'), 'utf8'),
) as { name: string; dependencies: Record<string, string> };

const actionYml = `name: Test Action
description: A test action for packaged generation
branding:
  icon: activity
  color: green
inputs:
  my-input:
    description: A test input
    required: false
    default: hello
runs:
  using: node24
  main: index.js
`;

const originalReadme = `# Hand-written heading  

<!-- start description -->
stale-description
<!-- end description -->

An unformatted paragraph   between sections.

<!-- start usage -->
stale-usage
<!-- end usage -->

<!-- start branding -->
stale-branding
<!-- end branding -->

Hand-written footer.  
`;

describe('Packaged entry points', () => {
  let tempDir: string;
  let readmePath: string;
  let isolatedBinaryPath: string;

  beforeAll(() => {
    const build = spawnSync('npm', ['run', 'build'], {
      cwd: repositoryDir,
      encoding: 'utf8',
      timeout: 60_000,
    });
    expect(build.status, build.error?.message ?? `${build.stdout}\n${build.stderr}`).toBe(0);
  }, 65_000);

  function writeConfig(overrides: Record<string, unknown> = {}) {
    fs.writeFileSync(
      path.join(tempDir, '.ghadocs.json'),
      JSON.stringify({
        owner: 'testowner',
        repo: 'testrepo',
        paths: { action: 'action.yml', readme: 'README.md' },
        sections: ['description', 'usage'],
        pretty: true,
        versioning: { enabled: true, source: 'explicit', override: '1.2.3', prefix: 'v' },
        ...overrides,
      }),
    );
  }

  function runNode(args: string[]) {
    return spawnSync(process.execPath, args, {
      cwd: tempDir,
      encoding: 'utf8',
      timeout: 30_000,
      env: Object.fromEntries(
        Object.entries(process.env).filter(
          ([key]) =>
            !key.startsWith('INPUT_') && key !== 'GITHUB_ACTIONS' && key !== 'GITHUB_REPOSITORY',
        ),
      ),
    });
  }

  function expectGeneratedReadme() {
    const generated = fs.readFileSync(readmePath, 'utf8');
    const description = generated.match(
      /<!-- start description -->([\s\S]*?)<!-- end description -->/u,
    )?.[1];
    const usage = generated.match(/<!-- start usage -->([\s\S]*?)<!-- end usage -->/u)?.[1];
    const workflow = usage?.match(/```yaml\n([\s\S]*?)\n```/u)?.[1];

    expect(description?.trim()).toBe('A test action for packaged generation');
    expect(YAML.parse(workflow ?? '')).toEqual([
      { uses: 'testowner/testrepo@v1.2.3', with: { 'my-input': '' } },
    ]);
    expect(generated).toBe(
      originalReadme
        .replace('\nstale-description\n', description ?? '')
        .replace('\nstale-usage\n', usage ?? ''),
    );
  }

  function installLibraryFixture() {
    const modulesDir = path.join(tempDir, 'node_modules');
    const libraryDir = path.join(modulesDir, packageManifest.name);
    fs.mkdirSync(path.join(libraryDir, 'dist'), { recursive: true });
    fs.copyFileSync(
      path.join(repositoryDir, 'package.json'),
      path.join(libraryDir, 'package.json'),
    );
    fs.copyFileSync(path.join(repositoryDir, 'action.yml'), path.join(libraryDir, 'action.yml'));
    fs.cpSync(path.join(repositoryDir, 'dist/mjs'), path.join(libraryDir, 'dist/mjs'), {
      recursive: true,
    });

    // The library resolves its declared dependencies; the CLI fixture receives only its binary.
    for (const dependency of Object.keys(packageManifest.dependencies)) {
      const target = path.join(modulesDir, dependency);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.symlinkSync(path.join(repositoryDir, 'node_modules', dependency), target, 'junction');
    }
  }

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-packaged-entry-test-'));
    readmePath = path.join(tempDir, 'README.md');
    isolatedBinaryPath = path.join(tempDir, 'index.js');
    fs.copyFileSync(path.join(repositoryDir, 'dist/bin/index.js'), isolatedBinaryPath);
    fs.writeFileSync(path.join(tempDir, 'action.yml'), actionYml);
    fs.writeFileSync(readmePath, originalReadme);
    writeConfig();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('generates a README from the CLI copied alone without node_modules', () => {
    const result = runNode([isolatedBinaryPath]);

    expect(result.status, result.stderr).toBe(0);
    expectGeneratedReadme();
  });

  it('reports startup failures from the isolated CLI with a nonzero exit', () => {
    fs.rmSync(readmePath);

    const result = runNode([isolatedBinaryPath]);

    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr.trim()).toBe(`ENOENT: no such file or directory, access '${readmePath}'`);
    expect(fs.existsSync(readmePath)).toBe(false);
  });

  it('reports SVG write failures before the isolated CLI changes the README', () => {
    const svgPath = path.join(tempDir, 'branding.svg');
    fs.mkdirSync(svgPath);
    writeConfig({ sections: ['branding'], branding_svg_path: svgPath });

    const result = runNode([isolatedBinaryPath]);

    expect(result.status, result.stderr).toBe(1);
    expect(result.stderr.trim()).toBe(
      `EISDIR: illegal operation on a directory, open '${svgPath}'`,
    );
    expect(fs.readFileSync(readmePath, 'utf8')).toBe(originalReadme);
  });

  it('completes generation while importing the public ESM library in native Node', () => {
    installLibraryFixture();
    const readmeAtImportPath = path.join(tempDir, 'README.at-import.md');
    const result = runNode([
      '--input-type=module',
      '--eval',
      `import assert from 'node:assert/strict';
       import { readFileSync, writeFileSync } from 'node:fs';
       const { generateReadme } = await import(${JSON.stringify(packageManifest.name)});
       assert.equal(typeof generateReadme, 'function');
       writeFileSync(${JSON.stringify(readmeAtImportPath)}, readFileSync(${JSON.stringify(readmePath)}));`,
    ]);

    expect(result.status, result.stderr).toBe(0);
    expectGeneratedReadme();
    expect(fs.readFileSync(readmeAtImportPath, 'utf8')).toBe(fs.readFileSync(readmePath, 'utf8'));
  });

  it('rejects a native library import with the original filesystem error', () => {
    installLibraryFixture();
    fs.rmSync(readmePath);
    const result = runNode([
      '--input-type=module',
      '--eval',
      `import assert from 'node:assert/strict';
       await assert.rejects(import(${JSON.stringify(packageManifest.name)}), {
         code: 'ENOENT', path: ${JSON.stringify(readmePath)},
       });`,
    ]);

    expect(result.status, result.stderr).toBe(0);
    expect(fs.existsSync(readmePath)).toBe(false);
  });
});
