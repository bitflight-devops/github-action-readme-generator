module.exports = {
  root: true,
  plugins: [
    '@typescript-eslint',
    'sort-class-members',
    'simple-import-sort',
    'import',
    'jest',
    'security',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:security/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'airbnb-base',
    'plugin:prettier/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'es2022',
    sourceType: 'module',
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: ['.eslintrc.js', '.gulpfile.js'],
  rules: {
    'no-unused-vars': 'off',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'import/first': 'error',
    'import/newline-after-import': 'error',
    'import/no-absolute-path': 'error',
    'import/no-duplicates': 'error',
    'import/extensions': 'off',
    'security/detect-non-literal-fs-filename': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    'dot-notation': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // 'import/no-unresolved': [2, { commonjs: true }],
  },
  env: {
    es2021: true,
    node: true,
    'jest/globals': true,
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
};
