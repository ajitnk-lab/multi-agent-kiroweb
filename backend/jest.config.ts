import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/types/**'
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 70
    }
  }
};

export default config;
