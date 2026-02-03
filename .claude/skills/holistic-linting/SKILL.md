---
description: Comprehensive linting and formatting verification workflows for TypeScript/Biome projects. Provides automatic format-lint-resolve pipelines for orchestrators and sub-agents. Use when running linters, fixing Biome/TypeScript errors, ensuring code quality before completion, or resolving linting issues systematically.
---

# Holistic Linting Skill

This skill embeds comprehensive linting and formatting verification into Claude Code's workflow, preventing the common pattern where code is claimed "production ready" without actually running quality checks.

## Purpose

Prevent Claude from:

- Completing tasks without formatting and linting modified files
- Claiming code is "production quality" based on pattern-matching rather than verification
- Suppressing linting errors with `// biome-ignore` or `// @ts-ignore` without understanding root causes
- Adding workarounds that hide type safety issues

Ensure Claude:

- Automatically formats and lints all modified files before task completion
- Discovers project linters by scanning configuration files (biome.json, tsconfig.json, package.json)
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

- ❌ Do NOT run `biome format` before delegating
- ❌ Do NOT run `biome check` before delegating
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
- Runs formatters on modified files (biome format)
- Executes linters to identify issues (biome check, tsc)
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

This project uses **Biome** exclusively for linting and formatting TypeScript/JavaScript:

| Config File | Tools |
|------------|-------|
| `biome.json` | Biome (lint + format) |
| `tsconfig.json` | TypeScript compiler |
| `.markdownlint.json` | markdownlint |
| `.husky/` | Husky git hooks |

### Running Formatters and Linters

**TypeScript/JavaScript Files (Biome)**:

```bash
# Format and lint with auto-fix (preferred - single command)
npx biome check --write ./src/ ./__tests__/

# Check only (CI mode)
npx biome check ./src/ ./__tests__/

# Format only
npx biome format --write ./src/

# Lint only
npx biome lint ./src/
```

**TypeScript Type Checking**:

```bash
# Type check without emitting
npx tsc --noEmit

# Build (includes type checking)
npm run build
```

**Markdown Files**:

```bash
npm run lint:markdown
npm run lint:markdown:fix
```

### Resolving Linting Issues

**For Orchestrators**: Delegate immediately to linting-root-cause-resolver WITHOUT running linters yourself:

```claude
Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in src/inputs.ts")
Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in src/helpers.ts")
```

Do NOT run `biome check` or `tsc` before delegating. The agent gathers its own linting data.

**For Sub-Agents**: Follow the linter-specific resolution workflow documented below based on the linting tool reporting the issue.

## Linter-Specific Resolution Workflows

This section provides systematic resolution procedures for TypeScript/JavaScript linting tools. Sub-agents executing the linting-root-cause-resolver process MUST follow the appropriate workflow based on the linter reporting issues.

### Biome Resolution Workflow

**When to use**: Linting errors with Biome rule codes (lint/suspicious/*, lint/correctness/*, lint/style/*, lint/complexity/*, lint/security/*, lint/nursery/*)

**Resolution Process**:

1. **Research the Rule**

   Look up the rule at Biome's documentation:

   ```text
   https://biomejs.dev/linter/rules/{rule-name}
   ```

   Examples:
   - `noExplicitAny` → https://biomejs.dev/linter/rules/no-explicit-any
   - `useAwait` → https://biomejs.dev/linter/rules/use-await
   - `noForEach` → https://biomejs.dev/linter/rules/no-for-each

   This documentation provides:
   - What the rule prevents (design principle)
   - When code violates the rule
   - Example of violating code
   - Example of resolved code
   - Configuration options

2. **Read Rule Documentation**

   The Biome rule documentation contains critical information:

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

   Rerun Biome to confirm the fix:

   ```bash
   npx biome check /path/to/file.ts
   ```

**Common Biome Fixes**:

| Rule | Bad Pattern | Good Pattern |
|------|------------|--------------|
| `noExplicitAny` | `obj: any` | `obj: unknown` with type guards |
| `useExplicitType` | `export const x = new Class()` | `export const x: Class = new Class()` |
| `useAwait` | `async function f() { return promise; }` | `async function f() { return await promise; }` |
| `noParameterAssign` | `value = value.trim()` | `const trimmed = value.trim()` |
| `noForEach` | `arr.forEach(fn)` | `for (const item of arr) { fn(item); }` |

### TypeScript Resolution Workflow

**When to use**: Type errors with TypeScript error codes (TSxxxx format like TS2345, TS7006, TS2322)

**Resolution Process**:

1. **Research the Error Code**

   TypeScript errors have numeric codes like TS2345. Look up the error:
   - Official handbook: https://www.typescriptlang.org/docs/handbook/
   - Error messages list: https://typescript.tv/errors/

2. **Trace Type Flow**

   Follow the data flow to understand type relationships:
   - What type does TypeScript think the variable is?
   - What type does TypeScript expect?
   - Where does the variable get its type?

3. **Check Architectural Context**

   Understand the design intent:
   - What is this function supposed to do?
   - What types should it accept and return?
   - Is the current type annotation accurate?

4. **Implement Elegant Fix**

   Choose the appropriate fix strategy:

   **Strategy A: Fix the type annotation** (if annotation is wrong)
   **Strategy B: Fix the implementation** (if annotation is correct)
   **Strategy C: Add type narrowing** (if type is conditional)
   **Strategy D: Use type assertion** (only after validation)

5. **Verify Resolution**

   ```bash
   npx tsc --noEmit
   ```

## Biome Rule Categories

The project enforces strict linting with these rule categories:

### Error Level (Blocks CI)
- `correctness/*` - Catch bugs (unused imports, variables)
- `security/*` - Prevent XSS, injection
- `nursery/useExplicitType` - Require explicit types on exports
- `suspicious/useAwait` - Async functions must use await
- `suspicious/noEvolvingTypes` - Variables must have stable types

### Warning Level (Should Fix)
- `complexity/noForEach` - Prefer for...of loops
- `complexity/useLiteralKeys` - Prefer obj.key over obj['key']
- `style/noParameterAssign` - Don't reassign parameters
- `style/useNodejsImportProtocol` - Use node: prefix
- `suspicious/noConsole` - Avoid console in production
- `suspicious/noExplicitAny` - Use unknown instead

### Test File Overrides (__tests__/**/*.ts)
Relaxed rules for test files:
- `useAwait`: off (vi.mock uses async callbacks)
- `useNamingConvention`: off (legacy patterns)
- `noMisplacedAssertion`: off (assertions in mock callbacks)
- `noConsole`: off (debug logging in tests)
- `useExplicitType`: off (inference in tests is fine)

## Integration with Git Hooks

Pre-commit runs:
1. `lint-staged` - Formats and checks staged files
2. `npm run build` - Ensures build succeeds
3. `npm run generate-docs` - Updates README from action.yml

lint-staged config (from package.json):
```json
{
  "*.{md,yaml,yml,sh}": "prettier --write",
  "{src,__tests__}/**/*.ts": "biome check --write",
  "*.json": "biome format --write"
}
```

## Best Practices

1. **Orchestrators delegate immediately** - Do NOT run formatters or linters before delegating. Agent gathers its own context.
2. **Format before linting (Sub-Agents only)** - Formatters auto-fix trivial issues
3. **Run linters concurrently (Sub-Agents only)** - Use parallel execution for multiple files
4. **Never suppress without understanding** - Don't add `// biome-ignore` or `// @ts-ignore` without root cause analysis
5. **Orchestrators delegate, sub-agents execute** - Orchestrators launch agents and read reports. Sub-agents run formatters, linters, and resolve issues.
6. **Verify after fixes (Sub-Agents only)** - Always re-run linters to confirm issues are resolved
7. **Trust agent verification (Orchestrators)** - Read resolution reports instead of re-running linters to verify

## Troubleshooting

**Problem**: "I don't know which linters this project uses"
**Solution**: This project uses Biome for TypeScript/JavaScript and markdownlint for markdown. Check biome.json for configuration.

**Problem**: "Linting errors but I don't understand the rule"
**Solution**: Look up the rule at https://biomejs.dev/linter/rules/{rule-name}

**Problem**: "Multiple files with linting errors"
**Solution**: If orchestrator, launch concurrent linting-root-cause-resolver agents (one per file). If sub-agent, resolve each file sequentially.

**Problem**: "Type error I don't understand"
**Solution**: Research the TS error code, trace the type flow, understand what types are expected vs actual.

**Problem**: "False positive linting error"
**Solution**: Investigate using the rule's documentation. If truly a false positive, configure the rule in biome.json rather than using ignore comments.

## Examples

### Example 1: Orchestrator completes TypeScript feature implementation

```text
User: "Add authentication middleware to the API"

Orchestrator:
1. [Implements authentication middleware in auth.ts]
2. [Implementation complete, now applying holistic-linting skill]
3. [Delegates to linting agent WITHOUT running linters]
4. Task(agent="linting-root-cause-resolver", prompt="Format, lint, and resolve any issues in auth.ts")
5. [Agent formats with biome format, runs biome check + tsc]
6. [Agent finds 2 Biome errors, 1 TypeScript type issue]
7. [Agent resolves all 3 issues at root cause]
8. [Agent verifies: biome check + tsc - clean]
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
3. Formatting: npx biome format --write db_pool.ts
4. Linting: npx biome check db_pool.ts && npx tsc --noEmit
5. [Finds 1 Biome error: noExplicitAny on parameter]
6. [Investigates: parameter should be ConnectionConfig type]
7. [Fixes: Changes `any` to `unknown`, adds type guard]
8. [Verifies: npx biome check db_pool.ts - clean]
9. Returns to orchestrator with completed, lint-free module ✓
```

## Skill Activation

This skill is automatically loaded when installed in `~/.claude/skills/holistic-linting`.

To manually reference this skill in a session:

```text
Activate the holistic-linting skill: Skill(command: "holistic-linting")
```

## Bundled Resources

### Agent: linting-root-cause-resolver

Location: [`.claude/agents/linting-root-cause-resolver.md`](.claude/agents/linting-root-cause-resolver.md)

This agent systematically investigates and resolves linting errors by understanding root causes rather than suppressing them with ignore comments.

### Agent: post-linting-architecture-reviewer

Location: [`.claude/agents/post-linting-architecture-reviewer.md`](.claude/agents/post-linting-architecture-reviewer.md)

This agent verifies linting resolution quality and identifies systemic improvements.

### Project Configuration

Location: [`PROJECT-CONFIG.md`](PROJECT-CONFIG.md)

Project-specific Biome configuration and resolution patterns.
