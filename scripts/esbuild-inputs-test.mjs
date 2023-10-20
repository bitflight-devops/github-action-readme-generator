import * as esbuild from 'esbuild';
// import { nodeExternalsPlugin } from 'esbuild-node-externals';

const ESM_REQUIRE_SHIM = `
await(async()=>{let{dirname:e}=await import("path"),{fileURLToPath:i}=await import("url");if(typeof globalThis.__filename>"u"&&(globalThis.__filename=i(import.meta.url)),typeof globalThis.__dirname>"u"&&(globalThis.__dirname=e(globalThis.__filename)),typeof globalThis.require>"u"){let{default:a}=await import("module");globalThis.require=a.createRequire(import.meta.url)}})();
`;
await esbuild
  .build({
    entryPoints: ['./src/inputs.test.ts'],
    outdir: './out',
    bundle: true,
    minify: false,
    treeShaking: true,
    sourcemap: 'inline',
    platform: 'node',
    format: 'esm',
    target: 'node20',
    banner: {
      js: ESM_REQUIRE_SHIM,
    },
    plugins: [
      // nodeExternalsPlugin({
      //   dependencies: false,
      // }),
    ],
  })
  .catch(() => process.exit(1));
