import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'node_modules/',
      'playwright-report/',
      'test-results/',
      'blob-report/',
      'demo-results/',
      '.scratch/',
    ],
  },
  js.configs.recommended,
  {
    files: ['app/server.js', 'scripts/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['app/public/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Data-driven tests are generated in loops on purpose
      'playwright/valid-title': 'off',
      // Trips over page object methods like checkoutPage.fill(), which aren't raw page calls
      'playwright/prefer-locator': 'off',
    },
  },
);
