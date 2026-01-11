import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import babelParser from '@babel/eslint-parser';
import eslintCommentsPlugin from '@eslint-community/eslint-plugin-eslint-comments';
import importPlugin from 'eslint-plugin-import';
import nPlugin from 'eslint-plugin-n';
import optimizeRegexPlugin from 'eslint-plugin-optimize-regex';
import prettierPlugin from 'eslint-plugin-prettier';
import promisePlugin from 'eslint-plugin-promise';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import sortClassMembersPlugin from 'eslint-plugin-sort-class-members';
import unicornPlugin from 'eslint-plugin-unicorn';
import vitestPlugin from 'eslint-plugin-vitest';
import actionsPlugin from 'eslint-plugin-actions';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'dist/**',
      'lib/**',
      'node_modules/**',
      '.gulpfile.js',
      'scripts/esbuild.mjs',
      'package-lock.json',
      '__tests__/package.mock.json',
      '__tests__/payload.json',
    ],
  },

  js.configs.recommended,

  {
    files: ['**/*.ts', '**/*.mts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['./tsconfig.json'],
      },
      globals: {
        NodeJS: true,
        console: true,
        process: true,
        Buffer: true,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@eslint-community/eslint-comments': eslintCommentsPlugin,
      'import': importPlugin,
      'n': nPlugin,
      'optimize-regex': optimizeRegexPlugin,
      'prettier': prettierPlugin,
      'promise': promisePlugin,
      'simple-import-sort': simpleImportSortPlugin,
      // 'sonarjs': sonarjsPlugin, // Disabled due to ESLint 9 compatibility
      'sort-class-members': sortClassMembersPlugin,
      'unicorn': unicornPlugin,
    },
    rules: {
      // TypeScript recommended
      ...tsPlugin.configs.recommended.rules,

      // eslint-comments recommended
      '@eslint-community/eslint-comments/disable-enable-pair': 'off',
      '@eslint-community/eslint-comments/no-unused-disable': 'error',

      // promise recommended
      ...promisePlugin.configs.recommended.rules,

      // n recommended
      ...nPlugin.configs.recommended.rules,

      // Disable n/no-missing-import as it's too strict with type-only imports and deep package imports
      'n/no-missing-import': 'off',

      // sonarjs recommended - commented out due to ES Lint 9 compatibility issues
      // ...sonarjsPlugin.configs.recommended.rules,

      // unicorn recommended
      ...unicornPlugin.configs.recommended.rules,

      // optimize-regex recommended
      ...optimizeRegexPlugin.configs.recommended.rules,

      // prettier
      ...prettierConfig.rules,

      // Custom TypeScript rules
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/dot-notation': ['error'],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/func-call-spacing': 'off',
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-function-type': 'warn',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/restrict-plus-operands': 'error',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/semi': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/type-annotation-spacing': 'off',
      '@typescript-eslint/unbound-method': 'error',

      // Other overrides
      'camelcase': 'off',
      'consistent-return': 'off',
      'dot-notation': 'off',
      'import/extensions': 'off',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-extraneous-dependencies': 'off',
      'import/no-namespace': 'off',
      'import/no-unresolved': 'error',
      'import/prefer-default-export': 'off',
      'lines-between-class-members': 'off',
      'no-console': 'off',
      'no-plusplus': 'off',
      'no-restricted-syntax': 'off',
      'no-shadow': 'off',
      'no-underscore-dangle': 'off',
      'no-unused-vars': 'off',
      'one-var': 'off',
      'operator-linebreak': 'off',
      'quote-props': 'off',
      'semi': 'off',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
      'sort-class-members/sort-class-members': [
        2,
        {
          order: [
            '[static-properties]',
            '[static-methods]',
            '[properties]',
            '[conventional-private-properties]',
            'constructor',
            '[methods]',
            '[conventional-private-methods]',
          ],
          accessorPairPositioning: 'getThenSet',
        },
      ],
      'sort-imports': 'off',
      'space-before-function-paren': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/import-style': 'off',
      'unicorn/no-immediate-mutation': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/consistent-existence-index-check': 'off',
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
  },

  {
    files: ['__tests__/**/*.ts'],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      'vitest/expect-expect': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/valid-expect': 'error',
    },
  },

  {
    files: ['**/*.mjs', '**/*.cjs', '**/*.jsx'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        sourceType: 'script',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
      globals: {
        console: true,
        process: true,
        __dirname: true,
        module: true,
        require: true,
      },
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      'no-plusplus': 'off',
      'unicorn/prefer-module': 'off',
      'no-use-before-define': 'off',
      'no-console': 'off',
      'camelcase': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },

  {
    files: ['.github/workflows/*.{yml,yaml}', './action.yml'],
    plugins: {
      actions: actionsPlugin,
    },
    processor: 'actions/actions',
  },

  {
    files: ['*.yml', '*.yaml', '*.html', '*.json'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules,
      'no-plusplus': 'off',
    },
  },
];
