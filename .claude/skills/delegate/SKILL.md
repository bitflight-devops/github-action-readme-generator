---
description: Quick delegation template for sub-agent prompts. Use when assigning work to a sub-agent, before invoking the Task tool, or when preparing prompts for specialized agents. Provides the WHERE-WHAT-WHY framework. For comprehensive delegation guidance, see /how-to-delegate.
user-invocable: true
---

# Delegation Template

**Workflow Reference**: See [Multi-Agent Orchestration](./../knowledge/workflow-diagrams/multi-agent-orchestration.md) for complete delegation flow with DONE/BLOCKED signaling.

**Step 1:** Analyze the task. Do you have the "WHERE, WHAT, WHY"?

**Step 2:** Construct the prompt using the template below.

---

## Template

```text
Your ROLE_TYPE is sub-agent.

[Task Identification - one sentence]

OBSERVATIONS (Factual only):
- [Verbatim error messages]
- [Exact file:line references]
- [Environment state]
- [NO interpretations or "I think"]

DEFINITION OF SUCCESS (The "WHAT"):
- [Specific measurable outcome]
- [Acceptance criteria]
- [Verification method]

CONTEXT (The "WHERE" & "WHY"):
- Location: [Where to look]
- Scope: [Boundaries]
- Constraints: [Hard requirements vs Preferences]

AVAILABLE RESOURCES:
- [List available MCP tools]
- [Reference docs with @filepath]

YOUR TASK:
1. Run /verify (as completion criteria guide)
2. Perform comprehensive context gathering
3. Form hypothesis → Experiment → Verify
4. Implement solution
5. Only report completion after /verify criteria are met
```

---

## Delegation Rules

Check before sending:

| Rule               | Check                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------- |
| **Formula**        | Delegation = Observations + Success Criteria + Resources - Assumptions - Micromanagement |
| **No HOW**         | Do NOT tell agent _how_ to implement (e.g., "Change line 42 to X")                       |
| **Constraints OK** | DO tell agent _constraints_ (e.g., "Must use the 'requests' library")                    |
| **No Assumptions** | Do NOT say "The issue is probably..."                                                    |
| **Full Scope**     | If code smell found, instruct agent to audit _entire pattern_, not single instance       |

---

## Quick Checklist

- [ ] Starts with `Your ROLE_TYPE is sub-agent.`
- [ ] Contains only factual observations
- [ ] No assumptions stated as facts
- [ ] Defines WHAT and WHY, not HOW
- [ ] Lists resources without prescribing tools
