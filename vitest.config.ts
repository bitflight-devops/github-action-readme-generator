/// <reference types="vitest" />
// import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['dotenv/config'],
    environment: 'node',
    root: './',
    deps: {
      interopDefault: true,
    },
    coverage: {
      provider: 'v8',
      reportsDirectory: './out',
      reporter: ['text', 'json-summary', 'json'],
      include: ['src/'],
    },
  },
});
