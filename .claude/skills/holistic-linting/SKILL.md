---
description: Comprehensive linting and formatting verification workflows for TypeScript/Oxlint (Vite+) projects. Provides automatic format-lint-resolve pipelines for orchestrators and sub-agents. Use when running linters, fixing Oxlint/TypeScript errors, ensuring code quality before completion, or resolving linting issues systematically.
---

# Holistic Linting Skill

This skill embeds comprehensive linting and formatting verification into Claude Code's workflow, preventing the common pattern where code is claimed "production ready" without actually running quality checks.

## Purpose

Prevent Claude from:

- Completing tasks without formatting and linting modified files
- Claiming code is "production quality" based on pattern-matching rather than verification
- Assuming only tsc exists when projects may have multiple linting tools (Oxlint, markdownlint, etc.)
- Suppressing linting errors with `// oxlint-disable-next-line` or `// @ts-ignore` comments without understanding root causes

Ensure Claude:

- Automatically formats and lints all modified files before task completion
- Discovers project linters by scanning configuration files (vite.config.ts, tsconfig.json, package.json)
- Resolves linting issues systematically using root-cause analysis
- Orchestrates concurrent linting agents when multiple files have issues

## When This Skill Applies

This skill applies to **all code editing tasks** in projects with linting configuration. It provides different behavior based on Claude's role:

### For Orchestrators (Interactive Claude Code CLI)

After completing implementation work:

1. **Delegate immediately** - Launch linting-root-cause-resolver agent for modified files
2. **Read reports** - Agent produces resolution reports in `.claude/reports/`
3. **Delegate review** - Launch post-linting-architecture-reviewer to validate resolution quality
4. **Iterate if needed** - Re-delegate to resolver if reviewer identifies issues

**CRITICAL**: Orchestrators do NOT run formatting or linting commands themselves. The agent gathers its own linting data, formats files, runs linters, and resolves issues. Orchestrators only delegate tasks and read completion reports.

### For Sub-Agents (Task-delegated agents)

Before completing any task that involved Edit/Write:

1. **Format touched files** - Run formatters on files the agent modified
2. **Lint touched files** - Run linters on files the agent modified
3. **Resolve issues directly** - Use linting tools directly to fix issues
4. **Don't complete** - Don't mark task complete until all linting issues in touched files are resolved

<section ROLE_TYPE="orchestrator">

## Agent Delegation (Orchestrator Only)

### Complete Linting Workflow

**CRITICAL PRINCIPLE**: Orchestrators delegate work to agents. Orchestrators do NOT run formatting commands, linting commands, or quality checks themselves. The agent does ALL work (formatting, linting, resolution). The orchestrator only delegates tasks and reads reports to determine if more work is needed.

**WHY THIS MATTERS**:

- Pre-gathering linting data wastes orchestrator context window
- Running linters duplicates agent work (agent will run them again)
- Violates separation of concerns: "Orchestrators route context, agents do work"
- Creates context rot with linting output that becomes stale
- Prevents agents from gathering their own fresh context

The orchestrator MUST follow this delegation-first workflow:

**Step 1: Delegate to linting-root-cause-resolver immediately**

Delegate linting resolution WITHOUT running any linting commands first:

```text
Task(
  agent="linting-root-cause-resolver",
  prompt="Format, lint, and resolve any issues in <file_path>"
)
```

**What NOT to do before delegating**:

- ❌ Do NOT run `vp fmt` before delegating
- ❌ Do NOT run `vp check` before delegating
- ❌ Do NOT run `tsc` before delegating
- ❌ Do NOT gather linting output for the agent
- ❌ Do NOT read error messages to provide to the agent

**What TO do**:

- ✅ Delegate immediately with just the file path
- ✅ Let agent gather its own linting data
- ✅ Trust agent to run formatters and linters itself
- ✅ Wait for agent to complete and produce reports

**Reason**: The agent follows systematic root-cause analysis workflows. It autonomously:

- Discovers project linters by scanning configuration files
- Runs formatters on modified files (vp fmt)
- Executes linters to identify issues (vp check, which bundles format + lint + type-check)
- Researches rule documentation
- Traces type flows and architectural context
- Implements elegant fixes following TypeScript best practices
- Verifies resolution by re-running linters
- Creates resolution artifacts in `.claude/reports/` and `.claude/artifacts/`

**Multiple Files Modified**:

Launch concurrent agents (one per file) WITHOUT pre-gathering linting data:

```text
Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in src/inputs.ts")
Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in src/helpers.ts")
Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in __tests__/inputs.test.ts")
```

**Reason for concurrency**: Independent file resolutions proceed in parallel, reducing total time.

**Step 2: Delegate to post-linting-architecture-reviewer**

After linting agent completes, delegate architectural review:

```text
Task(
  agent="post-linting-architecture-reviewer",
  prompt="Review linting resolution for <file_path>"
)
```

**What the reviewer does**:

- Loads resolution artifacts from `.claude/reports/` and `.claude/artifacts/`
- Verifies resolution quality (root cause addressed, no symptom suppression)
- Validates architectural implications (design principles, type safety, code organization)
- Identifies systemic improvements applicable across codebase
- Generates architectural review report

**Step 3: Read reviewer report**

The orchestrator reads the review report to determine if additional work is needed:

```bash
ls -la .claude/reports/architectural-review-*.md
```

Read the most recent review report:

```claude
Read(".claude/reports/architectural-review-[timestamp].md")
```

**Orchestrator's role**: Read reports and decide next steps. Do NOT run linting commands to verify agent's work.

**Step 4: If issues found, delegate back to linting agent**

If architectural review identifies problems with resolution:

```text
Task(
  agent="linting-root-cause-resolver",
  prompt="Address issues found in architectural review: .claude/reports/architectural-review-[timestamp].md

Issues identified:
- [Summary of finding 1]
- [Summary of finding 2]

Review report contains detailed context and proposed solutions."
)
```

**Step 5: Repeat review if needed**

After re-resolution, delegate to reviewer again:

```text
Task(
  agent="post-linting-architecture-reviewer",
  prompt="Review updated linting resolution for <file_path>"
)
```

Continue workflow until architectural review reports clean results.

### Workflow Summary

```text
[Implementation complete]
  → [Step 1: Delegate to linting-root-cause-resolver] (agent formats, lints, resolves)
  → [Step 2: Delegate to post-linting-architecture-reviewer]
  → [Step 3: Orchestrator reads review report]
  → [Step 4: If issues found, delegate back to resolver with review path]
  → [Step 5: Repeat review until clean]
  → [Task complete ✓]
```

**Key Principle**: Orchestrator delegates immediately and reads reports. Agent does ALL actionable work (formatting, linting, resolution). Orchestrator does NOT run commands or gather linting data.

### Common Anti-Patterns to Avoid

**❌ WRONG** - Orchestrator pre-gathering linting data:

```text
# Don't do this:
Bash("vp check src/inputs.ts")
# Read the output...
# Then delegate with the output
Task(agent="linting-root-cause-resolver", prompt="Fix these errors: [pasted errors]")
```

**✅ CORRECT** - Orchestrator delegates immediately:

```text
# Do this instead:
Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in src/inputs.ts")
```

**❌ WRONG** - Orchestrator running formatters:

```text
# Don't do this:
Bash("vp fmt --write src/inputs.ts src/helpers.ts")
# Then delegate linting
```

**✅ CORRECT** - Agent handles both formatting and linting:

```text
# Do this instead:
Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in src/inputs.ts")
```

**❌ WRONG** - Orchestrator verifying agent's work by running linters:

```text
# Don't do this:
# Agent completes
Bash("vp check src/inputs.ts")  # Verifying agent's work
```

**✅ CORRECT** - Trust agent's verification, read reports instead:

```text
# Do this instead:
Read(".claude/reports/linting-resolution-[timestamp].md")
# Report shows agent already verified with linter output
```

</section>

## How to Use This Skill

### Automatic Behavior

This skill modifies Claude's standard workflow to include automatic quality checks:

**Before this skill**:

```text
[User request] → [Code changes] → [Task complete ✓]
```

**With this skill (Orchestrator)**:

```text
[User request] → [Code changes] → [Delegate to linting agent] → [Read reports] → [Task complete ✓]
```

**With this skill (Sub-Agent)**:

```text
[Task assigned] → [Code changes] → [Format] → [Lint] → [Resolve issues] → [Task complete ✓]
```

### Linter Detection

Linter detection is handled automatically by scanning project configuration files. The linting hook's `ConfigurationDetector` identifies available tools at runtime by checking:

| Config File                    | Tools Detected                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `.husky/` directory            | Husky git hooks (takes priority)                                                                       |
| `vite.config.ts`               | Oxlint (lint, type-aware) + Oxfmt (format) via Vite+'s `vp` CLI — `fmt`/`lint`/`check`/`staged` blocks |
| `tsconfig.json`                | TypeScript compiler                                                                                    |
| `package.json`, `.prettierrc*` | Prettier                                                                                               |
| `.markdownlint.json/.yaml`     | markdownlint                                                                                           |
| `.shellcheckrc`                | ShellCheck (shell scripts)                                                                             |

**Detection Priority** (highest to lowest):

1. Husky (if found, check what hooks run)
2. Oxlint/Vite+ (if vite.config.ts exists)
3. TypeScript (if tsconfig.json exists)
4. Other language-specific tools

The detection uses caching with a 5-minute TTL to avoid repeated disk reads.

### Running Formatters and Linters

**Git Hook Tool Detection** (if `.husky/` exists):

Check what the pre-commit hook runs:

```bash
cat .husky/pre-commit
```

**Important - Scoped Operations**: Always lint specific files rather than entire directories when possible. Running linters on all files formats code outside your current changes, causing:

- **Diff pollution**: Unrelated formatting changes appear in merge requests
- **Merge conflicts**: Changes to files not part of your feature
- **Broken git blame**: History attribution lost for mass-formatted files

Use `--all-files` equivalent ONLY when explicitly requested by the user for repository-wide cleanup.

**For TypeScript/JavaScript files (Oxlint + Oxfmt via Vite+)**:

```bash
# Format and lint with auto-fix, type-aware (preferred - single command)
vp check --fix path/to/file.ts

# Check only (CI mode, no fixes)
vp check path/to/file.ts

# Format only
vp fmt --write path/to/file.ts

# Lint only (type-aware, no format)
vp lint --type-aware --type-check path/to/file.ts
```

**For TypeScript type checking**:

```bash
# Type check without emitting files
npx tsc --noEmit

# Type check specific file (requires project context)
npx tsc --noEmit path/to/file.ts
```

**For Markdown**:

```bash
# Lint and auto-fix
npm run lint:markdown:fix

# Lint only (check mode)
npm run lint:markdown
```

### Resolving Linting Issues

**For Orchestrators**: Delegate immediately to linting-root-cause-resolver WITHOUT running linters yourself:

```claude
Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in src/inputs.ts")
Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in src/helpers.ts")
```

Do NOT run `vp check` or `tsc` before delegating. The agent gathers its own linting data.

**For Sub-Agents**: Follow the linter-specific resolution workflow documented below based on the linting tool reporting the issue.

## Linter-Specific Resolution Workflows

This section provides systematic resolution procedures for each major TypeScript/JavaScript linting tool. Sub-agents executing the linting-root-cause-resolver process MUST follow the appropriate workflow based on the linter reporting issues.

### Oxlint Resolution Workflow

**When to use**: Linting errors with Oxlint rule codes, namespaced `plugin(rule-name)` (e.g. `typescript(await-thenable)`, `eslint(no-unused-vars)`, `unicorn(...)`), grouped into seven categories: correctness, suspicious, pedantic, perf, style, restriction, nursery.

**Resolution Process**:

1. **Research the Rule**

   Look up the rule at Oxlint's rule reference:

   ```text
   https://oxc.rs/docs/guide/usage/linter/rules.html
   ```

   This project uses Oxlint's own default/recommended rule set as-is — there is no hand-maintained rule list to point to. Rules confirmed to fire against this codebase, via a real `vp lint --format github --type-aware --type-check src` run:

   ```text
   typescript(await-thenable)
   typescript(no-base-to-string)
   typescript(restrict-template-expressions)
   ```

   One scoped override exists in `vite.config.ts`: `typescript/unbound-method` is
   disabled for `__tests__/**`, because the vitest-mock idiom reads a method
   reference rather than detaching and calling it. Its reasoning is inline where
   the override lives — read it there rather than flagging the override as an
   unjustified suppression.

   This documentation provides:

   - What the rule prevents (design principle)
   - When code violates the rule
   - Example of violating code
   - Example of resolved code
   - Configuration options

2. **Read Rule Documentation Output**

   The Oxlint rule documentation contains critical information:

   - **Principle**: Why this pattern is problematic
   - **Bad Pattern**: What code triggers the rule
   - **Good Pattern**: How to fix it correctly

   **Motivation**: Understanding the principle prevents similar issues in other locations.

3. **Read the Affected Code**

   Read the complete file containing the linting error:

   ```claude
   Read("/path/to/file.ts")
   ```

   Focus on:

   - The line with the error
   - Surrounding context (5-10 lines before/after)
   - Related function/class definitions

4. **Check Architectural Context**

   Examine how this code fits into the broader system:

   - What does this function/module do?
   - How is it called by other code?
   - Are there similar patterns elsewhere in the codebase?

   Use Grep to find usage patterns:

   ```bash
   rg "function_name" --type ts
   ```

5. **Implement Elegant Fix**

   Apply the fix following these principles:

   - Address the root cause, not the symptom
   - Follow modern TypeScript patterns (TypeScript 5.x+)
   - Maintain or improve code readability
   - Consider performance and maintainability
   - Add comments only if the fix is non-obvious

6. **Verify Resolution**

   Rerun Oxlint to confirm the fix:

   ```bash
   vp check /path/to/file.ts
   ```

**Common Oxlint Fixes (verified findings from this repo)**: the three below are rules confirmed to fire against this codebase, not a full or authoritative list.

#### typescript(await-thenable)

```typescript
// ❌ Before: awaiting a value that isn't a Promise
async function getValue(): Promise<string> {
  return await plainString; // plainString is already a string, not a Promise
}

// ✅ After: only await actual Promises
async function getValue(): Promise<string> {
  return plainString;
}
```

#### typescript(no-base-to-string)

```typescript
// ❌ Before: relying on the default Object.prototype.toString()
function describe(value: SomeClass): string {
  return `Value: ${value}`; // implicit toString() may not be meaningful
}

// ✅ After: convert explicitly
function describe(value: SomeClass): string {
  return `Value: ${value.toDisplayString()}`;
}
```

#### typescript(restrict-template-expressions)

```typescript
// ❌ Before: interpolating a non-primitive in a template literal
const message = `Result: ${someObject}`;

// ✅ After: convert explicitly first
const message = `Result: ${JSON.stringify(someObject)}`;
```

Look up any other Oxlint finding individually at the rules reference above.

**Example Workflow Execution**:

```text
Issue: Oxlint reports "typescript(await-thenable): Unexpected `await` of a non-Promise value" in src/example.ts:42

1. Research: https://oxc.rs/docs/guide/usage/linter/rules.html (typescript(await-thenable))
   → Output: Awaiting a non-Promise value is a no-op that misleads readers about async behavior

2. Read code: Read("src/example.ts")
   → Line 42: return await getCachedValue();
   → getCachedValue() returns a plain string, not a Promise

3. Check context: Grep "getCachedValue" in project
   → Always returns synchronously; no async work happens inside it

4. Implement: Remove the unnecessary `await`
   return getCachedValue();

5. Verify: vp lint --type-aware --type-check src/example.ts → Clean
```

### TypeScript Compiler Resolution Workflow

**When to use**: Type checking errors with TypeScript error codes (TSxxxx format like TS2345, TS7006, TS2322, TS2339)

**Resolution Process**:

1. **Research the Error Code**

   TypeScript errors contain error codes like `TS2345` or `TS7006`.

   Look up the error code in TypeScript documentation:

   ```text
   https://typescript.tv/errors/#TS{CODE}
   https://www.typescriptlang.org/docs/handbook/
   ```

   Common error codes:

   - **TS2345**: Argument of type 'X' is not assignable to parameter of type 'Y'
   - **TS7006**: Parameter 'x' implicitly has an 'any' type
   - **TS2322**: Type 'X' is not assignable to type 'Y'
   - **TS2339**: Property 'x' does not exist on type 'Y'
   - **TS2532**: Object is possibly 'undefined'

   **Motivation**: TypeScript error codes map to specific type safety principles. Understanding the principle prevents misunderstanding type relationships.

2. **Read Error Code Documentation**

   The TypeScript documentation explains:

   - What type safety principle is violated
   - When this is an error (type violations)
   - When this is NOT an error (valid patterns)
   - Example of error-producing code
   - Example of corrected code

   **Key insight**: TypeScript errors often indicate misunderstanding about what types a function accepts or returns.

3. **Trace Type Flow**

   Follow the data flow to understand type relationships:

   a. **Read the error location**:

   ```claude
   Read("/path/to/file.ts")
   ```

   b. **Identify the type mismatch**:

   - What type does TypeScript think the variable is?
   - What type does TypeScript expect?
   - Where does the variable get its type?

   c. **Trace upstream**:

   - Read function signatures
   - Check return type annotations
   - Review variable assignments
   - Check imported type definitions

   d. **Check library type definitions**:

   - If the error involves a library, check node_modules/@types/
   - Look for .d.ts files in the library package
   - Check if types need updating

4. **Check Architectural Context**

   Understand the design intent:

   - What is this function supposed to do?
   - What types should it accept and return?
   - Is the current type annotation accurate?
   - Are there implicit contracts not captured in types?

5. **Implement Elegant Fix**

   Choose the appropriate fix strategy:

   **Strategy A: Fix the type annotation** (if annotation is wrong)

   ```typescript
   // Before: Function returns object but annotated as returning Response
   function getData(): Response {
     return { key: 'value' }; // TS2322: Type '{ key: string; }' is not assignable to type 'Response'
   }

   // After: Correct annotation to match actual return
   function getData(): Record<string, string> {
     return { key: 'value' };
   }
   ```

   **Strategy B: Fix the implementation** (if annotation is correct)

   ```typescript
   // Before: Function should return Response but returns object
   function getData(): Response {
     return { key: 'value' }; // TS2322
   }

   // After: Fix implementation to return correct type
   function getData(): Response {
     return new Response(JSON.stringify({ key: 'value' }));
   }
   ```

   **Strategy C: Add type narrowing** (if type is conditional)

   ```typescript
   // Before: TypeScript can't prove value is not undefined
   function process(value: string | undefined): string {
     return value.toUpperCase(); // TS2532: Object is possibly 'undefined'
   }

   // After: Add type guard
   function process(value: string | undefined): string {
     if (value === undefined) {
       throw new Error('value is required');
     }
     return value.toUpperCase();
   }
   ```

   **Strategy D: Use type assertion with validation**

   ```typescript
   // Before: TypeScript doesn't recognize runtime check
   const data: Record<string, unknown> = getData();
   const name: string = data.name; // TS2322: Type 'unknown' is not assignable to type 'string'

   // After: Validate then assert (NEVER assert without validation)
   const data: Record<string, unknown> = getData();
   if (typeof data.name !== 'string') {
     throw new Error('Expected name to be string');
   }
   const name: string = data.name; // TypeScript now knows this is string
   ```

   **Strategy E: Use type predicates for custom guards**

   ```typescript
   // Define a type predicate function
   function isValidConfig(obj: unknown): obj is ConfigType {
     if (typeof obj !== 'object' || obj === null) {
       return false;
     }
     const record = obj as Record<string, unknown>;
     return typeof record.name === 'string' && typeof record.version === 'string';
   }

   // Use the type predicate
   function processConfig(input: unknown): ConfigType {
     if (!isValidConfig(input)) {
       throw new Error('Invalid config format');
     }
     return input; // TypeScript knows input is ConfigType
   }
   ```

6. **Verify Resolution**

   Rerun TypeScript to confirm the fix:

   ```bash
   npx tsc --noEmit
   ```

**Example Workflow Execution**:

```text
Issue: TypeScript reports "TS2345: Argument of type 'unknown' is not assignable to parameter of type 'string'" in inputs.ts:125

1. Research: TS2345 - Type mismatch in function argument
   → Principle: Function expects specific type but receives incompatible type
   → Common cause: Missing type narrowing or wrong variable passed

2. Read documentation:
   → This occurs when passing value of wrong type to function parameter
   → Need to either change the value's type or the function's expectation

3. Trace type flow:
   - Read inputs.ts line 125
   - Function call: processValue(configValue)
   - processValue signature: function processValue(value: string): void
   - configValue comes from: config.get('key') which returns unknown
   - The config.get() return type is intentionally unknown

4. Check context:
   - config.get() returns unknown because config values can be any type
   - processValue specifically needs string
   - Need to validate configValue is string before passing

5. Implement: Add type narrowing before function call
   const configValue = config.get('key');
   if (typeof configValue !== 'string') {
     throw new Error('Expected config key to be string');
   }
   processValue(configValue);  // TypeScript now knows configValue is string

6. Verify: npx tsc --noEmit → Clean
```

## Integration: Resolution Process with TypeScript Best Practices

All linter resolution workflows should follow TypeScript best practices at the implementation stage. This integration ensures:

1. **Modern TypeScript Patterns**: Fixes use TypeScript 5.x+ syntax

   - Native ESM with `import.meta.dirname` (Node 20.11.0+)
   - Explicit type annotations on exports
   - Const assertions where appropriate
   - Satisfies operator for type validation

2. **Idiomatic Code**: Solutions follow TypeScript best practices

   - Clear naming conventions (camelCase for variables, PascalCase for types)
   - Proper use of type narrowing
   - Appropriate error handling with typed errors
   - Single Responsibility Principle

3. **Type Safety**: Type annotations are complete and accurate

   - Precise return types (avoid implicit any returns)
   - Correct parameter types with validation
   - Proper use of generics and utility types
   - No unnecessary type assertions

4. **Project Consistency**: Fixes align with existing codebase patterns
   - Consistent with project's CLAUDE.md standards
   - Matches existing module organization
   - Follows project-specific conventions (node: prefix, .js extensions)

**Activation pattern**:

```text
[Identify linting issue] → [Research rule] → [Read code] → [Check architecture]
→ [Implement elegant fix following TypeScript best practices] → [Verify]
```

## Bundled Resources

### Agent: linting-root-cause-resolver

Location: [`.claude/agents/linting-root-cause-resolver.md`](.claude/agents/linting-root-cause-resolver.md)

This agent systematically investigates and resolves linting errors by understanding root causes rather than suppressing them with ignore comments.

**Philosophy**:

- Linting errors are symptoms of deeper issues
- Never silence errors without understanding them
- Always verify assumptions through investigation
- Prioritize clarity and correctness over quick fixes

### Agent: post-linting-architecture-reviewer

Location: [`.claude/agents/post-linting-architecture-reviewer.md`](.claude/agents/post-linting-architecture-reviewer.md)

This agent verifies linting resolution quality and identifies systemic improvements.

### Project Configuration

Location: [`PROJECT-CONFIG.md`](PROJECT-CONFIG.md)

Project-specific Oxlint/Vite+ notes, linter detection override, and resolution patterns.

### Rules Knowledge Base

#### Oxlint Rules

Location: https://oxc.rs/docs/guide/usage/linter/rules.html

~847 rules (114 enabled by default), namespaced `plugin(rule-name)` (`typescript(...)`, `eslint(...)`, `unicorn(...)`, `import(...)`, `jsx-a11y(...)`, `promise(...)`, etc.) and grouped into seven categories:

- **correctness** - rules preventing actual bugs (most enabled by default)
- **suspicious** - rules flagging questionable patterns
- **pedantic** - rules enforcing stricter standards
- **perf** - rules optimizing code efficiency
- **style** - rules enforcing code style consistency
- **restriction** - rules limiting certain patterns
- **nursery** - experimental/newer rules

This project uses Oxlint's default/recommended set as-is via `vite.config.ts`'s `lint` block (`options: { typeAware: true, typeCheck: true }`) — there's no hand-maintained repo-specific rule list to keep in sync, unlike the old `biome.json`.

Each rule documents:

- What it prevents (design principle)
- When it's a violation (examples)
- When it's NOT a violation (edge cases)
- Violating code examples
- Resolved code examples
- Configuration options

#### TypeScript Error Codes

Location: https://typescript.tv/errors/

Comprehensive type checking error documentation:

- Type assignment errors (TS2322, TS2345)
- Property access errors (TS2339, TS2532)
- Implicit any errors (TS7006, TS7031)
- Module resolution errors (TS2307, TS2305)
- Declaration errors (TS2451, TS2300)

Each error code documents:

- Type safety principle it enforces
- When this is an error (type violations)
- When this is NOT an error (valid patterns)
- Error-producing code examples
- Corrected code examples

## Slash Commands

### `/lint` Command

The `/lint` slash command provides manual invocation of linting workflows.

**Usage**:

```bash
/lint                       # Lint all files in src/ and __tests__/
/lint path/to/file.ts       # Lint specific file
/lint path/to/directory     # Lint all files in directory
```

See [`.claude/commands/lint.md`](.claude/commands/lint.md) for the full command implementation.

## Integration with Git Hooks

This project uses Husky for git hooks. The pre-commit hook runs:

1. `vp staged` - Formats and checks staged files, per `vite.config.ts`'s `staged` block
2. `npm run build` - Ensures build succeeds
3. `npm run generate-docs` - Updates README from action.yml

`vite.config.ts`'s `staged` block is the single, authoritative config for pre-commit file processing — read it directly for the exact per-glob commands rather than trusting a copy here; there's no separate `.lintstagedrc` or `package.json` `lint-staged` block to reconcile against it.

This ensures:

- TypeScript files are formatted and linted before commit
- Other staged file types are handled per whatever `vite.config.ts`'s `staged` block configures for them

**holistic-linting skill** (Workflow guidance):

- Guides Claude's task completion workflow
- Ensures linting happens before claiming "done"
- Provides rules knowledge base for investigation
- Includes systematic resolution process via linting-root-cause-resolver agent

Use hooks and skill together for comprehensive linting coverage:

1. Hook catches issues immediately during editing
2. Skill ensures systematic resolution before task completion
3. Knowledge base supports root-cause analysis

## Examples

### Example 1: Orchestrator completes TypeScript feature implementation

```text
User: "Add authentication middleware to the API"

Orchestrator:
1. [Implements authentication middleware in auth.ts]
2. [Implementation complete, now applying holistic-linting skill]
3. [Delegates to linting agent WITHOUT running linters]
4. Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in auth.ts")
5. [Agent formats with vp fmt, runs vp check (format + lint + type-check)]
6. [Agent finds 2 Oxlint errors (typescript(await-thenable), typescript(no-base-to-string)), 1 TypeScript type issue]
7. [Agent resolves all 3 issues at root cause]
8. [Agent verifies: vp check - clean]
9. [Agent produces resolution report in .claude/reports/]
10. [Orchestrator reads report confirming clean resolution]
11. Task complete ✓
```

### Example 2: Sub-agent writes TypeScript module

```text
Orchestrator delegates: "Create database connection pool module"

Sub-agent:
1. [Writes db_pool.ts with connection logic]
2. [Before completing, applies holistic-linting skill]
3. Formatting: vp fmt --write db_pool.ts
4. Linting: vp check db_pool.ts (bundles lint + type-check via tsgolint)
5. [Finds 1 Oxlint error: typescript(await-thenable) on a return statement]
6. [Investigates: the awaited call is synchronous, not a Promise]
7. [Fixes: removes the unnecessary `await`]
8. [Verifies: vp check db_pool.ts - clean]
9. Returns to orchestrator with completed, lint-free module ✓
```

### Example 3: Resolving multiple Oxlint violations

```text
Oxlint reports 3 issues in validator.ts:
- typescript(await-thenable) at line 15
- typescript(no-base-to-string) at line 23
- typescript(restrict-template-expressions) at line 31

Sub-agent resolution:
1. Line 15 (await-thenable): `return await getValue()` where getValue() is synchronous
   Change to: return getValue();

2. Line 23 (no-base-to-string): `\`Item: ${item}\`` relies on default toString()
   Change to: `\`Item: ${item.toDisplayString()}\``

3. Line 31 (restrict-template-expressions): `\`Data: ${payload}\`` interpolates a non-primitive
   Change to: `\`Data: ${JSON.stringify(payload)}\``

4. Verify all fixes: vp check validator.ts → Clean
```

## Best Practices

1. **Orchestrators delegate immediately** - Do NOT run formatters or linters before delegating. Agent gathers its own context.
2. **Let detection find your linters** - The ConfigurationDetector scans project config files automatically. Don't assume which linters are available.
3. **Format before linting (Sub-Agents only)** - Formatters auto-fix trivial issues (end-of-file, whitespace)
4. **Run linters concurrently (Sub-Agents only)** - Use parallel execution for multiple files or multiple linters
5. **Use the rules documentation** - Reference official rule documentation when investigating (oxc.rs, typescript.tv)
6. **Never suppress without understanding** - Don't add `// oxlint-disable-next-line` or `// @ts-ignore` without root cause analysis
7. **Orchestrators delegate, sub-agents execute** - Orchestrators launch agents and read reports. Sub-agents run formatters, linters, and resolve issues.
8. **Verify after fixes (Sub-Agents only)** - Always re-run linters to confirm issues are resolved
9. **Trust agent verification (Orchestrators)** - Read resolution reports instead of re-running linters to verify

## Troubleshooting

**Problem**: "I don't know which linters this project uses"
**Solution**: Linters are detected automatically by scanning config files (vite.config.ts, tsconfig.json, package.json, etc.). Check the Linter Detection section for supported tools. This project uses Oxlint (via Vite+'s `vp` CLI) for TypeScript and markdownlint for markdown.

**Problem**: "Linting errors but I don't understand the rule"
**Solution**: Look up the rule at https://oxc.rs/docs/guide/usage/linter/rules.html for Oxlint rules, or https://typescript.tv/errors/ for TypeScript errors.

**Problem**: "Multiple files with linting errors"
**Solution**: If orchestrator, launch concurrent linting-root-cause-resolver agents (one per file). If sub-agent, resolve independent files concurrently too — only sequence files that genuinely depend on each other.

**Problem**: "Linter not found (command not available)"
**Solution**: `vp` is a separate global CLI, not something `npx` resolves from `node_modules` — the `prepare` npm script installs it automatically on `npm install` if missing. If it's still missing, run Vite+'s install script directly (`https://viteplus.dev/install.sh`).

**Problem**: "False positive linting error"
**Solution**: Investigate using the rule's documentation. If truly a false positive, silence just that line with `// oxlint-disable-next-line <rule-name>` (see https://oxc.rs/docs/guide/usage/linter/ignore-comments.html) and an explanatory comment — don't disable broadly, and don't reach for a repo-wide config override since none exists here by design.

**Problem**: "Type error I don't understand"
**Solution**: Research the TS error code, trace the type flow from variable declaration through usage, understand what types are expected vs actual.

## Skill Activation

This skill is automatically loaded when installed in `~/.claude/skills/holistic-linting` or `.claude/skills/holistic-linting`.

To manually reference this skill in a session:

```text
Activate the holistic-linting skill: Skill(command: "holistic-linting")
```

## Related Skills

- **TypeScript best practices** - Modern TypeScript development patterns
- **Node.js ESM** - ES Modules patterns for Node.js
