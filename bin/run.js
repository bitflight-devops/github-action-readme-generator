#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
// import 'ts-node/register';
const project = path.join(process.cwd(), 'tsconfig.json');
const dev = fs.existsSync(project);

if (dev) {
  const tsNode = await import('ts-node/esm');
  tsNode.register({ project, transpileOnly: true });
  import(`${process.cwd()}/src/index.ts`)
    .then(({ run }) => run())
    .catch(async (err) => console.log('error', err));
} else {
  await import(`${process.cwd()}/dist`)
    .then(({ run }) => run())
    .catch(async (err) => console.log('error', err));
}
