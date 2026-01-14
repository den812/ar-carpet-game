/**
 * Jest config — v11.3.1 (2026-01-13)
 * Full ESM + v8 coverage + 100% global thresholds
 */
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.js'],
  transform: { '^.+\.jsx?$': ['babel-jest', { configFile: './babel.config.js' }] },
  coverageProvider: 'v8',
  collectCoverage: true,
  collectCoverageFrom: [ 'src/**/*.js', '!**/node_modules/**', '!**/dist/**', '!**/.github/**' ],
  coverageThreshold: { global: { statements: 100, branches: 100, functions: 100, lines: 100 } },
  testMatch: ['<rootDir>/tests/**/*.test.js'],
};
