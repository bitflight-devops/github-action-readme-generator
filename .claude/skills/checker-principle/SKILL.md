---
description: Independent verification before trusting a fix, a bot finding, or your own diff. Always use this before marking a PR ready for review, before resolving or closing a review thread, before treating "this fix works" or "this diff is correct" as settled fact, and before acting on any unverified assumption about tool or environment behavior — including when you feel confident, since that confidence is exactly what this skill exists to check.
user-invocable: true
---

# Checker principle & Ha/H0 discipline

The agent that wrote a fix is the worst judge of whether it's correct — the
same reasoning that produced a mistake is the reasoning used to check it.

## The checker principle

- Never let the agent that wrote a fix also decide it's resolved.
- Spawn a fresh-context agent. Give it only the original comment/finding and
  the diff — never the reasoning that produced the fix.
- Frame it adversarially: ask it to find why the fix does **not** work, not
  to confirm that it does.
- Only call `resolve_thread` / mark a PR ready after an independent pass
  says so — never on your own say-so.
- Batch: verify several independent findings in parallel, fix them in one
  pass, run one checker pass over all of them together.

## Ha/H0 discipline

Before acting on an unverified belief ("this fix addresses the comment",
"this diff has no other issues", a tool's assumed default behavior): name
it **Ha** (what you're about to rely on) vs **H0** (how it could actually
be), and test which is true with the cheapest check available — one
command, one background agent — before committing further actions to it.

Applies to self-assessment too: "this diff is correct" is a hypothesis
about your own work, not a fact earned by writing it. A self-read before
marking something ready is a hygiene pass, not the validation step — the
same fresh-agent test applies.

Verify with the first unit before batching the rest — three parallel
agents built on one unverified assumption find out three times what one
check would've told you once.
