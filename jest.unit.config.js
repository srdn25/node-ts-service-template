/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/unit/**/*.spec.ts'],
  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  transformIgnorePatterns: ['/node_modules/(?!.*\\.mjs$)'],
  moduleFileExtensions: ['ts', 'js'],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/test/(.*)$': '<rootDir>/test/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/unit-setup.ts'],
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 30000,
};

module.exports = config;
