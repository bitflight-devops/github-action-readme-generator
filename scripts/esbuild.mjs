import * as esbuild from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

await esbuild
  .build({
    entryPoints: ['./src/index.ts'],
    outdir: 'dist/',
    bundle: true,
    minify: true,
    treeShaking: true,
    sourcemap: 'inline',
    platform: 'node',
    format: 'cjs',
    target: 'node20',
    plugins: [nodeExternalsPlugin()],
  })
  .catch(() => process.exit(1));
