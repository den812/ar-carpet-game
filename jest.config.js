
/**
 * Jest config — v11.3.3 (2026-01-14)
 * CHANGELOG:
 *  - FIX-1: Removed duplicate Jest config source by deleting `jest` key from package.json.
 *  - Switched testEnvironment to 'jsdom' to support DOM-based unit tests (e.g., OnScreenLogger).
 *  - Added moduleNameMapper for Three.js mocks and setupFilesAfterEnv.
 *  - ESM + v8 coverage + 100% global thresholds preserved.
 *  - FIX-2: Removed `extensionsToTreatAsEsm: ['.js']` — '.js' already inferred as ESM via package.json { "type": "module" }.
 */
export default {
  testEnvironment: 'jsdom',
  // ⚠️ Не указываем extensionsToTreatAsEsm для '.js' — это вызывает Validation Error в Jest.
  transform: { '^.+\\.jsx?$': ['babel-jest', { configFile: './babel.config.js' }] },
  coverageProvider: 'v8',
  collectCoverage: true,
  collectCoverageFrom: [ 'src/**/*.js', '!**/node_modules/**', '!**/dist/**', '!**/.github/**' ],
  coverageThreshold: { global: { statements: 100, branches: 100, functions: 100, lines: 100 } },
  moduleNameMapper: {
    '^three$': '<rootDir>/tests/mocks/three.js',
    '^three/addons/(.*)$': '<rootDir>/tests/mocks/three-addons.js',
    '^three/examples/jsm/(.*)$': '<rootDir>/tests/mocks/three-addons.js'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/']
};
