const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/integration/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js'],
  forceExit: true,
  detectOpenHandles: true,
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/test/(.*)$': '<rootDir>/test/$1',
  },
  transformIgnorePatterns: ['/node_modules/(?!.*\\.mjs$)'],
};

module.exports = config;
