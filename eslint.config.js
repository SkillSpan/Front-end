import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Build output, archived dead code and tool reports are not source. Only
  // `dist` was ignored before, so every stale `.build-check*` bundle in the
  // project root was linted as if it were hand-written code: 2 100+ errors of
  // noise that hid the ~50 real ones in src/.
  globalIgnores([
    'dist',
    '.build-check*',
    '_archive',
    'coverage',
    'lint-report.json',
    'vitest.config.js.timestamp-*.mjs',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // A bare `import React` is intentional in a few components (classic JSX
      // runtime) and the test setup exposes React globally.
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^(React|_)' }],
    },
  },
  {
    // Tests run under Node and use vitest globals.
    files: ['**/__tests__/**/*.{js,jsx}', 'src/test/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
])
