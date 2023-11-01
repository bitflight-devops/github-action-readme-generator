const pp = 'plugin:prettier/recommended';

/**
 * note: these rules are disabled because they are handled by prettier
 * - @typescript-eslint/func-call-spacing
 * - @typescript-eslint/semi
 * - @typescript-eslint/type-annotation-spacing
 * - operator-linebreak
 */
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    es2024: true,
    browser: false,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['*.yml', '*.yaml'],
      extends: [pp],
    },
    {
      files: ['*.mjs'],
      extends: ['airbnb-base', 'eslint:recommended', pp],
      parser: '@babel/eslint-parser',
      env: { es2022: true, node: true },
      parserOptions: {
        requireConfigFile: false,
        sourceType: 'script',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['*.cjs', '*.jsx'],
      plugins: ['import'],
      extends: ['airbnb-base', 'eslint:recommended', pp],
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
      parser: '@babel/eslint-parser',
      env: { es2022: true, node: true },
      parserOptions: {
        requireConfigFile: false,
        sourceType: 'script',
        ecmaVersion: 'latest',
        ecmaFeatures: {
          impliedStrict: true,
        },
      },
    },
    {
      files: ['*.html', '*.json'],

      extends: [pp],
      rules: {
        'no-plusplus': 'off',
      },
      parserOptions: {
        ecmaVersion: 2017,
      },

      env: {
        es6: true,
      },
    },
    {
      plugins: ['actions'],
      files: ['.github/workflows/*.{yml,yaml}', './action.yml'],
      processor: 'actions/actions',
    },
    {
      files: ['__tests__/**'], // or any other pattern
      plugins: ['vitest'],
      extends: ['plugin:vitest/recommended'],
    },
    {
      files: ['**/*.ts', '**/*.mts'],
      plugins: [
        'simple-import-sort',
        'import',
        '@typescript-eslint',
        'optimize-regex',
        'promise',
        'sort-class-members',
      ],
      extends: [
        'eslint:recommended',
        'plugin:@eslint-community/eslint-comments/recommended',
        'plugin:promise/recommended',
        'plugin:no-use-extend-native/recommended',
        'plugin:n/recommended',
        'plugin:@typescript-eslint/recommended',
        'airbnb-base',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
        'plugin:sonarjs/recommended',
        'plugin:unicorn/recommended',
        'plugin:optimize-regex/recommended',
        pp,
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      rules: {
        'no-underscore-dangle': 'off',
        'import/no-extraneous-dependencies': 'off',
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
        'operator-linebreak': 'off',
        'dot-notation': 'off',
        '@typescript-eslint/dot-notation': ['error'],
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/ban-ts-comment': 'error',
        '@typescript-eslint/consistent-type-assertions': 'error',
        '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          { accessibility: 'no-public' },
        ],
        'import/no-unresolved': 'error',
        '@typescript-eslint/func-call-spacing': 'off',
        '@typescript-eslint/lines-between-class-members': ['error'],
        '@typescript-eslint/no-explicit-any': 'off',
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
        '@eslint-community/eslint-comments/no-unused-disable': 'error',
        'quote-props': 'off',
        'camelcase': 'off',
        'consistent-return': 'off',
        'import/extensions': 'off',
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
        'import/no-namespace': 'off',
        'import/prefer-default-export': 'off',
        'lines-between-class-members': 'off',
        'no-console': 'off',
        'no-plusplus': 'off',
        'no-shadow': 'off',
        'no-unused-vars': 'off',
        'no-restricted-syntax': 'off',
        'one-var': 'off',
        'semi': 'off',
        'simple-import-sort/exports': 'error',
        'simple-import-sort/imports': 'error',
        'sort-imports': 'off',
        'sonarjs/cognitive-complexity': 'off',
        'space-before-function-paren': 'off',
        'unicorn/filename-case': 'off',
        'unicorn/import-style': 'off',
        'unicorn/no-null': 'off',
        'unicorn/prefer-module': 'off',
        'unicorn/prefer-top-level-await': 'off',
        'unicorn/prevent-abbreviations': 'off',

        '@typescript-eslint/no-array-constructor': 'error',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-extraneous-class': 'error',
        '@typescript-eslint/no-for-in-array': 'error',
        '@typescript-eslint/no-inferrable-types': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-assertion': 'warn',
      },
      globals: {
        NodeJS: true,
      },
      env: {
        browser: false,
        node: true,
        es2022: true,
      },
      settings: {
        'import/parsers': {
          '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true, // always try to resolve types under `<root>@types` directory even it doesn't contain any source code, like `@types/unist`
          },
        },
      },
    },
  ],
};
