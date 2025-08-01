module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      useESM: true,
      isolatedModules: true,
      diagnostics: false,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/jest/setupTests.ts'],
  testMatch: [
    '<rootDir>/test/jest/**/*.test.tsx',
    '<rootDir>/test/accessibility.test.tsx',
  ],
};
