// jest.config.ts
import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts', 'mts', 'cts', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/*.test.ts'],
  testRunner: 'jest-circus/runner',
  // modulePaths: ['<rootDir>'],
  // moduleDirectories: ["node_modules", "src"],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^(\\.{1,2}/.*)\\.mjs$': '$1',
  },
  // roots: ['<rootDir>/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
    // '^.+\\.[mc]?jsx?$': 'babel-jest',
  },
  // rootDir: '.',
  preset: 'ts-jest/presets/default-esm',
  setupFiles: ['dotenv/config'],
  reporters: ['default', 'jest-junit'],
  testPathIgnorePatterns: ['/helpers/', '/node_modules/'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  verbose: true,
};
export default config;
