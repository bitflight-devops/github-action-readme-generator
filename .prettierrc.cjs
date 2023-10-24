module.exports = {
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  bracketSameLine: true,
  proseWrap: 'preserve',
  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
  trailingComma: 'es5',
  bracketSpacing: true,
  semi: true,
  arrowParens: 'always',
  singleQuote: true,
  quoteProps: 'consistent',

  overrides: [
    {
      files: ['**/*.yml', '**/*.yaml'],
      options: {
        singleQuote: false,
        printWidth: 100,
        trimTrailingWhitespace:false,
        parser: 'yaml',
      },
    },
    {
      files: 'package*.json',
      options: {
        printWidth: 1000,
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      options: {
        parser: 'typescript',
        useTabs: false,
        tabWidth: 2,
        trailingComma: 'all',
        semi: true,
      },
    },
    {
      files: ['**/*.js', '**/*.jsx'],
      options: {
        parser: 'babel',
        useTabs: false,
        tabWidth: 2,
        trailingComma: 'all',
        semi: true,
      },
    },
    {
      files: ['**/*.json'],
      options: {
        singleQuote: false,
        quoteProps: 'preserve',
        parser: 'json',
      },
    },
    {
      files: ['**/*.json5'],
      options: {
        singleQuote: false,
        quoteProps: 'preserve',
        parser: 'json5',
      },
    },
    {
      files: ['**/*.md'],
      options: {
        parser: 'markdown',
        proseWrap: 'preserve',
      },
    },
    {
      files: ['**/*.css'],
      options: {
        parser: 'css',
      },
    },
    {
      files: ['**/*.scss'],
      options: {
        parser: 'scss',
      },
    },
    {
      files: ['**/*.less'],
      options: {
        parser: 'less',
      },
    },
    {
      files: ['**/*.sh'],
      options: {
        parser: 'sh',
        tabWidth: 2,
        useTabs: false,
      },
    },
  ],
};
