import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import { fixupConfigRules } from '@eslint/compat';
import babelParser from '@babel/eslint-parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import importPlugin from 'eslint-plugin-import';
import optimizeRegex from 'eslint-plugin-optimize-regex';
import promise from 'eslint-plugin-promise';
import sortClassMembers from 'eslint-plugin-sort-class-members';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import noUseExtendNative from 'eslint-plugin-no-use-extend-native';
import n from 'eslint-plugin-n';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import prettier from 'eslint-plugin-prettier';
import actions from 'eslint-plugin-actions';
import vitest from 'eslint-plugin-vitest';
import globals from 'globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

const pp = 'plugin:prettier/recommended';

export default [
  // Base ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'out/**',
      '*.min.js',
      'coverage/**',
      '.github/ghadocs/**',
      '**/*.json', // JSON files shouldn't be linted
    ],
  },

  // Base JavaScript config
  js.configs.recommended,

  // YAML files
  ...fixupConfigRules(
    compat.extends(pp).map((config) => ({
      ...config,
      files: ['**/*.yml', '**/*.yaml'],
    })),
  ),

  // JavaScript MJS files
  {
    files: ['**/*.mjs'],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 'latest',
      sourceType: 'script',
      parserOptions: {
        requireConfigFile: false,
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
      globals: {
        ...globals.es2022,
        ...globals.node,
      },
    },
    ...fixupConfigRules(compat.extends('airbnb-base', 'eslint:recommended', pp))[0],
    rules: {
      'import/no-extraneous-dependencies': 'off',
    },
  },

  // CommonJS files
  {
    files: ['**/*.cjs', '**/*.jsx'],
    languageOptions: {
      parser: babelParser,
      ecmaVersion: 'latest',
      sourceType: 'script',
      parserOptions: {
        requireConfigFile: false,
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
      globals: {
        ...globals.es2022,
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
    },
    ...fixupConfigRules(compat.extends('airbnb-base', 'eslint:recommended', pp))[0],
    rules: {
      'no-plusplus': 'off',
      'unicorn/prefer-module': 'off',
      'no-use-before-define': 'off',
      'no-console': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'camelcase': 'off',
      'import/extensions': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },

  // HTML and JSON files
  {
    files: ['**/*.html', '**/*.json'],
    ...fixupConfigRules(compat.extends(pp))[0],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es6,
      },
    },
    rules: {
      'no-plusplus': 'off',
      '@eslint-community/eslint-comments/no-unused-disable': 'off',
    },
  },

  // GitHub Actions workflow files
  {
    files: ['.github/workflows/*.{yml,yaml}', './action.yml'],
    plugins: {
      actions,
    },
    processor: 'actions/actions',
  },

  // Vitest test files
  {
    files: ['__tests__/**/*.ts'],
    plugins: {
      vitest,
    },
    ...vitest.configs.recommended,
  },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.mts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.es2022,
        ...globals.node,
        NodeJS: true,
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      'import': importPlugin,
      '@typescript-eslint': typescriptEslint,
      'optimize-regex': optimizeRegex,
      promise,
      'sort-class-members': sortClassMembers,
      '@eslint-community/eslint-comments': eslintComments,
      'no-use-extend-native': noUseExtendNative,
      n,
      sonarjs,
      unicorn,
      prettier,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...typescriptEslint.configs.recommended.rules,
      ...promise.configs.recommended.rules,
      ...noUseExtendNative.configs.recommended.rules,
      ...n.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      ...unicorn.configs.recommended.rules,
      ...optimizeRegex.configs.recommended.rules,
      ...prettier.configs.recommended.rules,
      ...eslintComments.configs.recommended.rules,

      // Import rules
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-namespace': 'off',
      'import/prefer-default-export': 'off',
      'import/no-extraneous-dependencies': 'off',
      'import/extensions': 'off',
      'import/no-unresolved': 'error',

      // Simple import sort
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
      'sort-imports': 'off',

      // Sort class members
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

      // TypeScript rules
      'dot-notation': 'off',
      '@typescript-eslint/dot-notation': ['error'],
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/consistent-type-assertions': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'no-public' }],
      '@typescript-eslint/func-call-spacing': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
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
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // ESLint comments
      '@eslint-community/eslint-comments/disable-enable-pair': 'off',
      '@eslint-community/eslint-comments/no-unused-disable': 'error',

      // General rules
      'no-underscore-dangle': 'off',
      'operator-linebreak': 'off',
      'quote-props': 'off',
      'camelcase': 'off',
      'consistent-return': 'off',
      'lines-between-class-members': 'off',
      'no-console': 'off',
      'no-plusplus': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      'no-restricted-syntax': 'off',
      'one-var': 'off',
      'semi': 'off',
      'space-before-function-paren': 'off',

      // SonarJS - disable some overly strict new rules in v3
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-commented-code': 'off',
      'sonarjs/publicly-writable-directories': 'off',
      'sonarjs/constructor-for-side-effects': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/no-os-command-from-path': 'off',
      'sonarjs/different-types-comparison': 'off',
      'sonarjs/redundant-type-aliases': 'off',
      'sonarjs/no-try-promise': 'off',
      'sonarjs/regex-complexity': 'off',

      // Unicorn - disable some new strict rules
      'unicorn/filename-case': 'off',
      'unicorn/import-style': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/prefer-string-raw': 'off',
      'unicorn/consistent-existence-index-check': 'off',
      'unicorn/no-immediate-mutation': 'off',

      // N (node) plugin - disable missing import checks (they don't work well with TypeScript)
      'n/no-missing-import': 'off',
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
];
