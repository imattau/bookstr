const eslintPluginReact = require('eslint-plugin-react');
const eslintPluginReactHooks = require('eslint-plugin-react-hooks');
const parserTypeScript = require('@typescript-eslint/parser');
const pluginTypeScript = require('@typescript-eslint/eslint-plugin');

module.exports = [
  {
    ignores: ['node_modules', 'build', 'dist'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: parserTypeScript,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        document: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': pluginTypeScript,
      react: eslintPluginReact,
      'react-hooks': eslintPluginReactHooks,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];
