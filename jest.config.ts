// jest.config.ts
import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/*.test.ts'],
  testRunner: 'jest-circus/runner',

  preset: 'ts-jest',
  setupFiles: ['dotenv/config'],
  reporters: ['default', 'jest-junit'],
  testPathIgnorePatterns: ['/helpers/', '/node_modules/'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  verbose: true,
};
export default config;
