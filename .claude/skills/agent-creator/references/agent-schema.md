# Agent YAML Frontmatter Schema Reference

Complete specification for Claude Code agent frontmatter fields (January 2026).

---

## Sources

- [Create Custom Subagents](https://code.claude.com/docs/en/sub-agents.md) (accessed 2026-01-28)
- [Agent Frontmatter Schema](https://code.claude.com/docs/en/agents.md) (accessed 2026-01-28)
- [Tools Reference](https://code.claude.com/docs/en/tools.md) (accessed 2026-01-28)
- [Skills Reference](https://code.claude.com/docs/en/skills.md) (accessed 2026-01-28)
- Validation implementation: [./../../scripts/validate_frontmatter.py](./../../scripts/validate_frontmatter.py)

For plugin agent integration, see [Claude Plugins Reference](./../../skills/claude-plugins-reference-2026/SKILL.md)

---

## Required Fields

### name

- **Type**: string
- **Max Length**: 64 characters
- **Format**: lowercase letters, numbers, hyphens only
- **Purpose**: Unique identifier for the agent

```yaml
name: code-reviewer          # Good
name: Code_Reviewer          # Invalid - uppercase, underscores
name: my-super-awesome-long-agent-name-that-exceeds-the-limit  # Invalid - too long
```

### description

- **Type**: string
- **Max Length**: 1024 characters (first 1024 chars most important)
- **Purpose**: Claude uses this to decide when to delegate tasks to this agent

**Follow the official Anthropic guidance in the `write-frontmatter-description` skill.**

Must be complete and informative, explaining what the agent does and when to use it. Include trigger scenarios, file types, or tasks.

```yaml
# Good - complete and informative
description: 'Review Python code for security vulnerabilities, performance issues, and PEP 8 compliance. Handles code reviews after changes complete or when reviewing pull requests. Specializes in async/await patterns.'

# Bad - too vague
description: Helps with Python
```

### YAML Multiline Bug

**Do NOT use YAML multiline indicators** (`>-`, `|`, `|-`) for descriptions. Claude Code's indexer does not parse them correctly - the description appears as ">-" instead of actual content.

```yaml
# WRONG - will show ">-" as description
description: >-
  This is a multiline
  description that breaks.

# CORRECT - single quoted string
description: 'This works correctly. Use single quotes for descriptions with special characters or keep on one line.'
```

---

## Optional Fields

### model

- **Type**: string
- **Default**: inherit (uses the same model as the main conversation)
- **Options**: `sonnet`, `opus`, `haiku`, `inherit`

| Value     | Use Case                               |
| --------- | -------------------------------------- |
| `haiku`   | Fast, simple operations (search, read) |
| `sonnet`  | Balanced - most agents (default)       |
| `opus`    | Complex reasoning, difficult debugging |
| `inherit` | Match parent conversation model        |

```yaml
model: sonnet
```

#### When to Use `model: inherit`

The `inherit` option makes the agent use the same model as the parent conversation rather than a fixed model.

**Use `model: inherit` when:**

1. **Context-appropriate capability** - Agent should match user's model choice

   - User chose Opus for complex work → agent gets Opus
   - User chose Haiku for speed → agent gets Haiku
   - Agent adapts to conversation context

2. **User-controlled cost/capability trade-off** - Let user decide model via conversation settings

   - User sets model at conversation level
   - Agent respects that choice automatically
   - No need to change agent configuration

3. **Flexible workflows** - Agent is used in multiple contexts with different needs
   - Research phase (might use Haiku for speed)
   - Implementation phase (might use Opus for complexity)
   - Same agent, different requirements per context

**Use explicit model (`sonnet`, `opus`, `haiku`) when:**

1. **Task requires specific capability** - Agent needs minimum model capability

   - Complex debugging always needs `opus`
   - Simple file search always works with `haiku`
   - Task complexity is known and fixed

2. **Cost control** - Prevent unexpected high costs

   - Read-only analyzer should stay `haiku` even if parent uses Opus
   - Prevents accidental expensive operations

3. **Consistent behavior** - Agent must perform the same way every time
   - Production agents with SLAs
   - Agents where capability variance is unacceptable

**Decision Tree:**

```
Does the task REQUIRE a specific model capability?
├─ Yes → Use explicit model (opus/sonnet/haiku)
└─ No → Should the agent adapt to user's choice?
   ├─ Yes → Use `inherit`
   └─ No → Use `sonnet` (safe default)
```

**Examples:**

```yaml
# Inherit - adapts to conversation context
name: general-helper
model: inherit
description: Helps with various tasks matching conversation complexity

# Explicit Haiku - always fast and cheap
name: file-searcher
model: haiku
description: Search files for patterns (simple task)

# Explicit Opus - always maximum capability
name: architecture-reviewer
model: opus
description: Review system architecture for flaws (complex task)

# Explicit Sonnet - balanced default
name: code-writer
model: sonnet
description: Write production code (moderate complexity)
```

### tools

- **Type**: string (comma-separated scalar; NOT a YAML array)
- **Default**: Inherited from parent conversation
- **Purpose**: ALLOWLIST - only these tools available

```yaml
# CORRECT: comma-separated string format
tools: Read, Grep, Glob, Bash

# Pattern matching for specific commands
tools: Bash(git:*), Bash(npm:install)
```

**Available Tools**: Read, Write, Edit, Bash, Grep, Glob, NotebookEdit, AskUserQuestion, WebSearch, Task, ToolSearch, Skill

**Note**: MCP tools from installed servers are also available and follow pattern `mcp__server-name__tool-name`

**Pattern Matching Examples**:

```yaml
# Allow only specific git commands
tools: Bash(git:status), Bash(git:log), Bash(git:diff)

# Allow git read operations only
tools: Bash(git:status|log|diff|show)

# Allow all git commands
tools: Bash(git:*)

# Combine with other tools
tools: Read, Grep, Bash(git:*), Bash(npm:install)
```

### disallowedTools

- **Type**: string (comma-separated scalar; NOT a YAML array)
- **Default**: none
- **Purpose**: DENYLIST - remove from inherited tools

```yaml
disallowedTools: Write, Edit, Bash
```

### permissionMode

- **Type**: string
- **Default**: `default`
- **Options**:

| Mode                | File Edits   | Bash Commands       | Description                |
| ------------------- | ------------ | ------------------- | -------------------------- |
| `default`           | Prompts user | Prompts user        | Normal permission behavior |
| `acceptEdits`       | Auto-accepts | Prompts destructive | Good for documentation     |
| `dontAsk`           | Auto-denies  | Auto-denies         | Read-only operation        |
| `bypassPermissions` | Skips all    | Skips all           | Dangerous - trusted only   |
| `plan`              | Disabled     | Disabled            | Planning mode, no writes   |

```yaml
permissionMode: acceptEdits
```

### skills

- **Type**: string (comma-separated scalar; NOT a YAML array)
- **Default**: none (skills NOT inherited)
- **Purpose**: Load skill content into agent context

```yaml
# CORRECT: comma-separated string
skills: python-development, testing-patterns, security-best-practices
```

**Important**: Agents do NOT inherit skills from parent conversation. Must explicitly list needed skills.

### hooks

- **Type**: object
- **Default**: none
- **Purpose**: Lifecycle hooks scoped to this agent

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
          timeout: 5000
  PostToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "./scripts/lint.sh"
  Stop:
    - hooks:
        - type: command
          command: "./scripts/cleanup.sh"
```

**Hook Events:**

- `PreToolUse` - Before tool executes (can block with exit 2)
- `PostToolUse` - After tool succeeds
- `PostToolUseFailure` - After tool fails
- `PermissionRequest` - When permission needed
- `UserPromptSubmit` - When user submits prompt
- `Notification` - When notifications are sent
- `Stop` - When agent completes
- `SubagentStart` - When child agent starts
- `SubagentStop` - When child agent completes
- `Setup` - During initialization
- `SessionStart` - At session beginning
- `SessionEnd` - At session end
- `PreCompact` - Before conversation compaction

For complete hook reference, see [Claude Hooks Reference](./../../skills/claude-hooks-reference-2026/SKILL.md)

### color

- **Type**: string
- **Default**: none
- **Purpose**: UI-only visual identifier for the subagent in Claude Code

Notes:

- The official "Create custom subagents" docs describe choosing a color to help identify which subagent is running in the UI: `https://code.claude.com/docs/en/sub-agents.md`
- No behavioral effect is described (does not change delegation logic, tools, permissions, model, hooks, or the system prompt).

```yaml
color: cyan      # Analysis agents
color: yellow    # Warning/optimization
color: green     # Success/validation
color: orange    # Audit/review
color: red       # Error handling
```

### argumentHint

- **Type**: string
- **Default**: none
- **Purpose**: Hint text shown to users when invoking the agent manually
- **Note**: Less commonly used; primarily for user-facing CLI hints

```yaml
argumentHint: '<file-path> [options]'
```

### alwaysLoadSkills

- **Type**: boolean
- **Default**: false
- **Purpose**: When true, load agent's skills into context even when agent is not directly invoked
- **Use Case**: Rare; for agents that provide skills to parent conversation

```yaml
alwaysLoadSkills: true
```

---

## Complete Example

```yaml
---
name: security-auditor
description: 'Audit code for security vulnerabilities including OWASP Top 10, injection risks, and authentication flaws. Use when reviewing security-sensitive code or before production deployment. Proactively invoked after changes to auth or data handling code.'
model: opus
tools: Read, Grep, Glob, Bash(git:log), Bash(git:diff)
disallowedTools: Write, Edit
permissionMode: dontAsk
skills: security-best-practices, owasp-guidelines
hooks:
  Stop:
    - hooks:
        - type: command
          command: "./scripts/log-audit.sh"
color: red
---
```

---

## Plugin Integration

When creating agents for plugins, additional considerations apply:

**Location**: `{plugin-root}/agents/` directory

**Registration**: Agents must be listed in `plugin.json`:

```json
{
  "name": "my-plugin",
  "agents": ["./agents/security-reviewer.md", "./agents/code-formatter.md"]
}
```

**Important**: The `agents` field in `plugin.json` must be an array of individual file paths, NOT a directory string:

```json
// CORRECT
"agents": ["./agents/reviewer.md", "./agents/tester.md"]

// INCORRECT - will fail validation
"agents": "./agents/"
```

**Validation**: After creating plugin agents:

```bash
# Validate frontmatter
uv run plugins/plugin-creator/scripts/validate_frontmatter.py validate ./agents/my-agent.md

# Validate complete plugin
claude plugin validate ./path/to/plugin
```

For complete plugin reference, see [Claude Plugins Reference](./../../skills/claude-plugins-reference-2026/SKILL.md)

---

## Validation Rules

Before saving an agent, verify:

1. **name**

   - [ ] Lowercase only
   - [ ] Only letters, numbers, hyphens
   - [ ] Max 64 characters
   - [ ] Unique in project

2. **description**

   - [ ] Max 1024 characters
   - [ ] Contains action verbs
   - [ ] Contains trigger phrases
   - [ ] Contains relevant keywords

3. **model** (if specified)

   - [ ] Valid option: sonnet, opus, haiku, inherit

4. **tools** (if specified)

   - [ ] All tools are valid tool names
   - [ ] Pattern syntax correct for Bash restrictions

5. **skills** (if specified)

   - [ ] All skills exist in project

6. **permissionMode** (if specified)

   - [ ] Valid option with justification if bypassPermissions

7. **YAML syntax**
   - [ ] Valid YAML
   - [ ] Proper quoting for multiline strings
   - [ ] No trailing commas or syntax errors
   - [ ] No YAML multiline indicators (`>-`, `|-`) in description field

## Automated Validation

Use the validation script for comprehensive checks:

```bash
# Validate single agent
uv run plugins/plugin-creator/scripts/validate_frontmatter.py validate ./agents/my-agent.md

# Auto-fix common issues (dry-run first)
uv run plugins/plugin-creator/scripts/validate_frontmatter.py fix ./agents/my-agent.md --dry-run

# Batch validation
uv run plugins/plugin-creator/scripts/validate_frontmatter.py batch ./agents/

# Batch fix
uv run plugins/plugin-creator/scripts/validate_frontmatter.py fix-batch ./agents/
```

**What the validator checks**:

- YAML syntax validity
- Required fields presence (name, description)
- Field type correctness (string, boolean, object)
- Field value constraints (length, format, enumeration)
- Tool/skill format (comma-separated strings, not YAML arrays)
- Forbidden multiline indicators

**What the validator auto-fixes**:

- YAML arrays → comma-separated strings
- Multiline descriptions → single-line quoted strings
- Unquoted descriptions with special characters

SOURCE: [validate_frontmatter.py](./../../scripts/validate_frontmatter.py) lines 103-187

---

## Related Documentation

- [Claude Skills Reference](./../../skills/claude-skills-overview-2026/SKILL.md) - Skills system overview
- [Claude Plugins Reference](./../../skills/claude-plugins-reference-2026/SKILL.md) - Plugin integration
- [Claude Hooks Reference](./../../skills/claude-hooks-reference-2026/SKILL.md) - Hook configuration
