---
description: Planning before multi-step or repeated work. Use this before starting anything that will take more than a couple of turns, to lay out real dependencies and what can run in parallel before diving in, and whenever you're tempted to turn a repeated push-check-iterate pattern into an automated loop — check the four conditions here first, don't assume it qualifies.
user-invocable: true
---

# Planning multi-step work

## Plan the graph, not just the next step

Before starting, work out:

- The actual next steps, not just the next one.
- Which steps have a real dependency on another's output vs. are just
  typed in sequence (the "fake edge" test: draw an arrow between each
  consecutive pair, keep it only if data actually flows across it).
  Independent steps run concurrently — batched tool calls, parallel
  background subagents — not queued for no reason.
- Whether a repeated mechanical step should become a reusable script.
- Whether a step's output should reorder the plan, rather than forcing
  the original sequence to hold.
- Before sequencing two pieces of work through your own turn just to
  avoid a hypothetical conflict, check whether the second piece could
  instead be written straight into the first agent's own instructions,
  or dispatched immediately in isolation (e.g. a separate API call
  instead of a shared local checkout, or worktree isolation) — so it
  never needs to contend with the first agent's state at all.

## When a loop is warranted

A push → check → iterate pattern earns automation only when all four hold:

- It recurs regularly, not once.
- It can grade itself (a pass/fail condition, no human needed).
- A goal returns a result with no mid-loop intervention required.
- The stop condition is a fact (status enum, exit code), not a feeling.

A single status-check-then-stop is just a read, always fine. Iterating on
failure is different: choosing what to push next is a judgment call (see
the `checker-principle` skill), so bound it explicitly — max iterations,
idempotent fixes, and a point where an unresolved failure surfaces for a
human or an independent pass rather than triggering another push.
