# AGENTS.md

Instructions for AI agents (Claude, Codex, and others) working in this repository.

## Independent verification (the checker principle)

An agent that writes a fix is the worst judge of whether the fix is correct — the
same reasoning that produced a mistake is the reasoning used to check for it.
When verifying whether a change actually resolves a review comment, bug report,
or finding:

- Never let the agent that wrote the fix also decide it's resolved (e.g. don't
  self-approve a change and then also close/resolve the review thread for it).
- Spawn a fresh-context agent for the check. Give it only the original
  comment/finding and the diff — never the reasoning that produced the fix. A
  checker that shares context with the worker isn't checking anything, it's
  agreeing with itself in a different window.
- Default to an adversarial framing: ask the checker to find a reason the fix
  does **not** resolve the issue, not to confirm that it does. Don't reward it
  for being agreeable.
- Subagents are you, just with clean, targeted context — spinning one up for
  this isn't outsourcing to someone else, it's using an isolated instance of
  yourself that hasn't seen, and isn't biased by, the work under review.
- Only mark something resolved (e.g. `resolve_thread`) after an independent,
  fresh-context pass says so — not on your own say-so, no matter how confident.

## Loop vs. one-off (when to automate a workflow)

A workflow earns a loop (plan → execute → check → iterate → stop) only when all
four hold at once:

- It recurs regularly, not once.
- It can grade itself — a condition that passes or fails without a human, or
  the same agent's own judgment, in the loop.
- Handing it a goal returns a result with no mid-loop intervention required.
- The stop condition is a fact (a status enum, an exit code), not a feeling.

Only the **status-check step** qualifies outright — polling a status enum
after a push and stopping on green is a fact-based check with nothing to
apply the four conditions against, it's just a read. **Iterating on
failure is a different action bundled under the same name, and it doesn't
get the same free pass**: choosing what to push next is a judgment call
(the same one the checker principle above exists to decorrelate from the
agent making it), and pushing repeatedly with no cap is exactly the
unbounded loop the four conditions are meant to rule out. Treat push →
check → iterate as a loop only with explicit bounds: a maximum number of
iterations, fixes that are safe to retry (idempotent — re-running one
doesn't compound on a half-applied previous attempt), and a point where
an unresolved failure surfaces for a human or an independent pass rather
than triggering another push on its own. "Is this review comment
actually addressed" does **not**
qualify on its own — it's a judgment call — but pairing it with the checker
principle above makes it tractable without pretending it's a fact.

## Before multi-step work: plan the graph, not just the next step

Before starting anything that will take more than a couple of turns, work out:

- What are the actual next steps toward the goal, not just the next one?
- Which of those steps have a real dependency on each other's output, and
  which are just typed in sequence (the "fake edge" test — draw an arrow
  between each consecutive pair, keep it only if data actually flows across
  it)? Independent steps should run concurrently — batched tool calls in one
  turn, or parallel background subagents — not queued one after another for
  no reason.
- Can a repeated mechanical step become a reusable script instead of being
  re-derived by hand each time it comes up?
- Does a step's own output change what later steps should be? Reorder the
  plan around that, rather than forcing the original sequence to hold.

## Handling incoming PR review comments (the recurring instance of all this)

1. Verify each comment against primary sources and the actual current
   file/repo state — don't accept or dismiss a bot finding on its wording
   alone.
2. Fix genuine gaps. When a detail can't be confirmed from documentation, run
   the real tool to get a real answer rather than leaving it as a guess (e.g.
   install the CLI and run `--help` instead of assuming what flags it takes).
3. Before resolving or closing a thread, hand the diff and the original
   comment — nothing else — to a fresh-context agent and get an explicit
   satisfied/not-satisfied verdict per the checker principle above.
4. Only resolve threads the checker actually confirms. Leave the rest open and
   iterate.
5. Batch: verify multiple independent comments in parallel, fix them in one
   edit pass, and run a single checker pass over all of them together rather
   than one comment at a time.

## The standing goal for this repo's tooling migration

The end state is Vite+ driving the **entire** project lifecycle — format,
lint, build, test, package, and release — not a partial adoption running
alongside legacy tools. If a task in service of some other goal turns out to
need more of that system in place to actually complete, treat that as a
signal to bring the relevant piece of the Vite+ migration forward, rather
than working around the gap. See
`docs/typescript-7-vite-plus-conversion-plan.md` for the phased plan this
repo is following toward that end state.

## Don't read what a cheap agent can read for you

Every tool call in your own turn re-processes your entire existing context — on a long session, that's expensive regardless of how small the individual output is. A fresh subagent (a cheap model) starts with none of that baggage, so it isn't just cheaper per call, it's cheaper by an order of magnitude for exactly the calls that are heaviest for you specifically: reading logs, search results, or large documents.

- If a step is "read this large/raw thing and tell me what matters," delegate it. Give the agent the source (a log, a URL, a file, a search query) and ask it to return only the synthesized finding plus a pointer back to the source (a file path and line, a URL, a quoted excerpt) — enough to independently verify the claim without having ingested the raw material yourself.
- This isn't a reason to explore less — it's a reason not to be the one doing the reading. Delegating the exploration doesn't delegate away scrutiny; the checker principle above still applies to what the agent reports back.
- Before waiting on your own turn to sequence two pieces of work, ask whether the second piece could have been written into the first agent's own instructions, or dispatched immediately (e.g. via the GitHub API instead of a local checkout, or with worktree isolation) so it never needs to contend with the first agent's state. Sequencing steps through your own turn just to avoid a hypothetical conflict is itself a cost that a little more upfront planning avoids.
- Don't schedule a wakeup to poll for a background agent's completion — it already notifies you when done. A scheduled poll on top of that is a redundant, wasted wakeup.
