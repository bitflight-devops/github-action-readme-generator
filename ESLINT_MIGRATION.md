# ESLint 9 Migration Guide

## Overview

This document explains the migration from ESLint 8 to ESLint 9 with the new flat config system for 2026 compatibility.

## What Changed

### 1. ESLint Core Upgrade

**Before:** ESLint v8.52.0 (October 2023)
**After:** ESLint v9.39.2 (December 2024 - latest stable)

ESLint 9 is a major update that introduces the "flat config" system as the default, replacing the old `.eslintrc.*` format.

### 2. Configuration Format Migration

**Before:** `.eslintrc.cjs` + `.eslintignore`
**After:** `eslint.config.js` (flat config)

The new flat config:
- Uses JavaScript/ESM imports instead of string-based plugin names
- Combines config and ignore patterns in a single file
- Provides better type checking and IDE support
- More explicit about what's being configured

### 3. TypeScript ESLint Upgrade

**Before:** @typescript-eslint v6.9.1
**After:** @typescript-eslint v8.51.0

TypeScript ESLint v8 is required for ESLint 9 compatibility. Notable changes:
- Removed deprecated rule: `@typescript-eslint/lines-between-class-members`
- Updated rule behaviors for better type checking
- Improved performance

### 4. Plugin Updates

All ESLint plugins were updated to their latest versions:

| Plugin | Old Version | New Version | Major Changes |
|--------|-------------|-------------|---------------|
| eslint-plugin-lodash | 7.4.0 | 8.0.0 | Requires ESLint 9 |
| eslint-plugin-sonarjs | 0.22.0 | 3.0.5 | Major rewrite with new rules |
| eslint-plugin-unicorn | 49.0.0 | 62.0.0 | Many new strict rules |
| eslint-plugin-promise | 6.1.1 | 7.2.1 | Breaking changes in defaults |
| eslint-plugin-n | 16.2.0 | 17.23.1 | Updated Node.js rules |
| eslint-plugin-vitest | 0.3.8 | 0.5.4 | Better Vitest support |

### 5. New Dependencies

Added for ESLint 9 compatibility:
- **@eslint/compat**: Allows using legacy configs with ESLint 9 (specifically `eslint-config-airbnb-base`)
- **@eslint/eslintrc**: FlatCompat utility for migration
- **@eslint/js**: ESLint's recommended JavaScript rules
- **typescript-eslint**: Unified TypeScript ESLint tooling
- **globals**: Standard global variable definitions

**Why keep `eslint-config-airbnb-base`?**
- Still actively maintained (last updated November 2024)
- Provides comprehensive, battle-tested rules for JavaScript files
- Only used for `.mjs` and `.cjs` files (build scripts and config files), not TypeScript source
- Using `@eslint/compat` as a compatibility bridge until airbnb-base adds native flat config support

### 6. Removed Files

- `.eslintrc.cjs` - Replaced by `eslint.config.js`
- `.eslintignore` - Patterns now in `eslint.config.js` ignores

## Migration Details

### Configuration Structure

The flat config uses an array of configuration objects:

```javascript
export default [
  // Ignores (replaces .eslintignore)
  {
    ignores: ['dist/**', 'node_modules/**', ...]
  },
  
  // File-specific configs
  {
    files: ['**/*.ts'],
    languageOptions: { parser, parserOptions },
    plugins: { pluginName: pluginObject },
    rules: { ... }
  }
]
```

### Plugin Loading

**Before (.eslintrc.cjs):**
```javascript
plugins: ['@typescript-eslint']
extends: ['plugin:@typescript-eslint/recommended']
```

**After (eslint.config.js):**
```javascript
import typescriptEslint from '@typescript-eslint/eslint-plugin';
plugins: {
  '@typescript-eslint': typescriptEslint
}
rules: {
  ...typescriptEslint.configs.recommended.rules
}
```

### Compatibility with Legacy Configs

For plugins that don't yet support flat config (like `eslint-config-airbnb-base`), we use `@eslint/compat`:

```javascript
import { FlatCompat } from '@eslint/eslintrc';
import { fixupConfigRules } from '@eslint/compat';

const compat = new FlatCompat({ baseDirectory: __dirname });

// Convert old-style extends
...fixupConfigRules(compat.extends('airbnb-base'))
```

## Rule Changes

### Deprecated Rules Removed

- `@typescript-eslint/lines-between-class-members` - No longer exists in v8

### New Rules Disabled

We disabled several overly-strict new rules that don't fit the project's coding style:

**SonarJS v3 (disabled):**
- `sonarjs/no-commented-code` - Allow commented code for context
- `sonarjs/publicly-writable-directories` - Too many false positives
- `sonarjs/slow-regex` - Complex regexes are sometimes necessary
- `sonarjs/no-os-command-from-path` - Path operations are safe in our context

**Unicorn v62 (disabled):**
- `unicorn/prefer-string-raw` - Not always more readable
- `unicorn/no-immediate-mutation` - Common pattern in our codebase
- `unicorn/consistent-existence-index-check` - Doesn't fit our style

**Node Plugin (disabled):**
- `n/no-missing-import` - This rule flags module imports as missing even when TypeScript resolves them correctly (e.g., `@actions/github/lib/context.js`). TypeScript's compiler already validates imports, making this rule redundant and error-prone for TypeScript projects.

## Testing & Validation

After migration:
- ✅ All 114 tests passing
- ✅ Build successful
- ✅ ESLint linting: 0 errors, 0 warnings
- ✅ TypeScript compilation: No errors
- ✅ Prettier formatting: Compatible

## npm Scripts Updated

```json
{
  "lint:eslint": "eslint --color ./src/ ./__tests__/",
  "lint:eslint:fix": "eslint --color --fix ./src/ ./__tests__/"
}
```

Removed the `-c .eslintrc.cjs` flag since flat config is auto-detected.

## Benefits of ESLint 9

1. **Better Performance**: Flat config is faster to load and process
2. **Type Safety**: Import-based configuration works better with TypeScript
3. **Explicit Configuration**: No hidden extends or plugin magic
4. **Future-Proof**: ESLint 10 will only support flat config
5. **Better IDE Support**: Direct imports improve autocomplete and errors

## Troubleshooting

Common issues when working with the new flat config:

### "Could not find plugin" errors

If you encounter plugin-related errors, verify the plugin is:
1. Listed in package.json dependencies
2. Imported at the top of eslint.config.js
3. Added to the plugins object in the config

### "Rule not found" errors

Check if the rule was:
1. Renamed in the latest plugin version
2. Removed (deprecated)
3. Moved to a different plugin

### Legacy peer dependency warnings

When running `npm install --legacy-peer-deps`, this is expected because `eslint-config-airbnb-base` (v15.0.0) requires `eslint@^7.32.0 || ^8.2.0` as a peer dependency and hasn't yet added ESLint 9 support. We use `@eslint/compat` to bridge this gap safely. The config is still maintained (last updated November 2024) and will likely add ESLint 9 support in a future release.

## References

- [ESLint v9 Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
- [ESLint Flat Config Documentation](https://eslint.org/docs/latest/use/configure/configuration-files)
- [TypeScript ESLint v8 Release Notes](https://typescript-eslint.io/blog/announcing-typescript-eslint-v8)
- [SonarJS v3 Documentation](https://github.com/SonarSource/eslint-plugin-sonarjs)

## Rollback Instructions

If you need to rollback to ESLint 8:

1. Restore the old dependencies in package.json
2. Restore .eslintrc.cjs and .eslintignore
3. Delete eslint.config.js
4. Run `rm package-lock.json && npm install`
5. Update npm scripts to add `-c .eslintrc.cjs` flag

However, this is not recommended as ESLint 8 is now in maintenance mode.
