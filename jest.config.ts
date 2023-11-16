// jest.config.ts
import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  clearMocks: true,
  automock: true,
  moduleFileExtensions: ['js', 'ts', 'mts', 'cts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',

  preset: 'ts-jest/presets/default-esm',
  setupFiles: ['dotenv/config'],
  reporters: ['default', 'jest-junit'],
  testPathIgnorePatterns: ['/helpers/', '/node_modules/'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  verbose: true,
};
export default config;
