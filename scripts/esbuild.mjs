import * as esbuild from 'esbuild';
import { writeFileSync } from 'node:fs';
// import { nodeExternalsPlugin } from 'esbuild-node-externals';

const ESM_REQUIRE_SHIM = `#!/usr/bin/env node

await(async()=>{let{dirname:e}=await import("path"),{fileURLToPath:i}=await import("url");if(typeof globalThis.__filename>"u"&&(globalThis.__filename=i(import.meta.url)),typeof globalThis.__dirname>"u"&&(globalThis.__dirname=e(globalThis.__filename)),typeof globalThis.require>"u"){let{default:a}=await import("module");globalThis.require=a.createRequire(import.meta.url)}})();
`;
await esbuild
  .build({
    entryPoints: ['./src/index.ts'],
    outdir: './dist/bin/',
    bundle: true,
    minify: false,
    treeShaking: true,
    sourcemap: 'inline',
    platform: 'node',
    format: 'esm',
    target: 'node20',
    metafile: true,
    external: ['prettier'],
    banner: {
      js: ESM_REQUIRE_SHIM,
    },
    plugins: [
      // nodeExternalsPlugin({
      //   dependencies: false,
      // }),
    ],
  })
  .then((result) => {
    if (result.metafile) {
      writeFileSync('meta.json', JSON.stringify(result.metafile, null, 2));
      console.log('✓ Metafile written to meta.json');
    }
  })
  .catch(() => process.exit(1));
