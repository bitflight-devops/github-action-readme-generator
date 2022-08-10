#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
const project = path.join(process.cwd(), '../tsconfig.json');
const dev = fs.existsSync(project);

if (dev) {
  const tsNode = await import('ts-node');
  tsNode.register({ project });
}
require(`../${dev ? 'src/markdowner' : 'dist'}`)
  .run()
  .catch(require('@oclif/errors/handle'));
