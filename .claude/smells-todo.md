# Code Smells - Observed Technical Debt

## Legacy Node.js Patterns

- [ ] `src/svg-editor.mts:110` - Callback-based `fs.writeFile()` instead of promises

## TypeScript Modernization

- [ ] `src/constants.ts:37-57` - String enum `ConfigKeys` (21 values)
- [ ] `src/errors/error-type.ts:1-7` - String enum `ErrorType`
- [ ] `src/logtask/index.ts:19-26` - Numeric enum `LogGroup`
- [ ] `src/Action.ts:130,132,218` - Type assertions using `as` instead of `satisfies`
- [ ] `src/inputs.ts:348,368,437` - Type assertions using `as` instead of `satisfies`
- [ ] `src/markdowner/index.ts:81` - Type assertion using `as`
- [ ] `src/sections/update-branding.ts:95` - Type assertion using `as`

## Mutable Static State

- [ ] `src/logtask/index.ts:140` - Shared mutable `Map` as static property
- [ ] `src/logtask/index.ts:145,208-209` - Static `indentWidth` mutated at runtime

## Error Handling

- [ ] `src/index.ts:16` - No top-level error handler for `generateReadme()`
- [ ] `src/prettier.ts:72-73` - Error swallowed, only logged
- [ ] `src/save.ts:22-23` - Error swallowed, only logged
- [ ] `src/inputs.ts:609-610` - Error swallowed, only logged
- [ ] `src/helpers.ts:151,200,221,242,327` - Untyped error catches
- [ ] `src/readme-editor.ts:49` - Untyped error catch
- [ ] `src/config.ts:79,87` - Untyped error catches
- [ ] `src/Action.ts:185,250` - Untyped error catches
- [ ] `src/inputs.ts:362,609` - Untyped error catches
- [ ] `src/helpers.ts:152` - Error wrapped without `{ cause: error }`
- [ ] `src/Action.ts:186` - Error wrapped without `{ cause: error }`

## Unnecessary `return await`

- [ ] `src/prettier.ts:25,41` - `return await format()`
- [ ] `src/sections/index.ts:36,39,42,45,48,51,54,57` - All switch cases use `return await`

## Complexity

- [ ] `src/helpers.ts:237-256` - Nested try-catch cascade (3 levels)
- [ ] `src/markdowner/index.ts:90-126` - 36-line function with multiple responsibilities
- [ ] `src/markdowner/index.ts:104-122` - 4 levels of nesting

## Magic Numbers

- [ ] `src/helpers.ts:103` - `const width = 80`
- [ ] `src/helpers.ts:121` - `width * 0.67`
- [ ] `src/sections/update-branding.ts:85,131` - `'15%'` duplicated
- [ ] `src/sections/update-title.ts:28` - `'60px'`

## Code Duplication

- [ ] `src/sections/update-inputs.ts:43` and `src/sections/update-outputs.ts:42` - Identical regex pattern

## Dead Code

- [ ] `src/sections/index.ts:28-30` - Commented-out condition
- [ ] `src/sections/update-usage.ts:64-66` - Commented-out code
