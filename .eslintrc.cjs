const pp = 'plugin:prettier/recommended';
const a = 'auto';
module.exports = {
  root: true,
  env: {
    node: true,
    es6: true,
  },
  overrides: [
    {
      files: ['*.yml', '*.yaml'],
      parser: 'yaml-eslint-parser',
      extends: ['plugin:yml/recommended', 'plugin:yml/prettier', pp],
    },
    {
      files: ['*.js', '*.cjs'],
      extends: [a, pp],
      rules: {
        'no-plusplus': 'off',
        'unicorn/prefer-module': 'off',
        'no-use-before-define': 'off',
        'no-console': 'off',
        'sonarjs/cognitive-complexity': 'off',
        camelcase: 'off',
      },
      parser: '@babel/eslint-parser',
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
      extends: [a, pp],
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
      files: ['.github/workflows/*.{yml,yaml}'],
      processor: 'actions/actions',
    },
    {
      files: ['*.ts'],
      plugins: ['simple-import-sort', 'import', 'jest', '@typescript-eslint', 'security', 'github'],
      extends: ['eslint:recommended', 'plugin:security/recommended'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'es2021',
        sourceType: 'module',
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      rules: {
        'no-plusplus': 'off',
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
        'eslint-comments/no-use': 'off',
        'import/no-namespace': 'off',
        'no-unused-vars': 'off',
        'github/no-then': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        'security/detect-non-literal-fs-filename': 'off',
        '@typescript-eslint/strict-boolean-expressions': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          { accessibility: 'no-public' },
        ],
        '@typescript-eslint/no-require-imports': 'error',
        '@typescript-eslint/array-type': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/ban-ts-comment': 'error',
        camelcase: 'off',

        '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
        '@typescript-eslint/func-call-spacing': ['error', 'never'],

        '@typescript-eslint/no-array-constructor': 'error',
        '@typescript-eslint/no-empty-interface': 'error',
        '@typescript-eslint/no-extraneous-class': 'error',
        '@typescript-eslint/no-for-in-array': 'error',
        '@typescript-eslint/no-inferrable-types': 'error',
        '@typescript-eslint/no-misused-new': 'error',
        '@typescript-eslint/no-namespace': 'error',
        '@typescript-eslint/no-non-null-assertion': 'warn',
        '@typescript-eslint/no-unnecessary-qualifier': 'error',
        '@typescript-eslint/no-unnecessary-type-assertion': 'error',
        '@typescript-eslint/no-useless-constructor': 'error',
        '@typescript-eslint/no-var-requires': 'error',
        '@typescript-eslint/prefer-for-of': 'warn',
        '@typescript-eslint/prefer-function-type': 'warn',
        '@typescript-eslint/prefer-includes': 'error',

        '@typescript-eslint/prefer-string-starts-ends-with': 'error',
        '@typescript-eslint/promise-function-async': 'error',
        '@typescript-eslint/require-array-sort-compare': 'error',
        '@typescript-eslint/restrict-plus-operands': 'error',
        semi: 'error',
        '@typescript-eslint/semi': 'error',
        '@typescript-eslint/type-annotation-spacing': 'error',
        '@typescript-eslint/unbound-method': 'error',
        'space-before-function-paren': 'off',
      },
      env: {
        node: true,
        es6: true,
        es2021: true,
        'jest/globals': true,
      },
    },
  ],
};
