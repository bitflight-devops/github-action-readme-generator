---
name: pr-review-workflow
description: Managing an open PR through review to merge in this repo. Use this whenever a PR review comment or bot finding (CodeRabbit, Codex, etc.) arrives on a PR you opened or are watching, whenever you're deciding if a draft PR is ready to come out of draft, and whenever a review thread might be ready to resolve or close.
user-invocable: true
---

# PR review workflow

## Handling incoming review comments

1. Verify each comment against primary sources and the actual current
   file/repo state — don't accept or dismiss a bot finding on its wording
   alone.
2. Fix genuine gaps. When a detail can't be confirmed from documentation,
   run the real tool for a real answer (e.g. `--help`) instead of guessing.
3. Before resolving a thread, hand the diff and the original comment —
   nothing else — to a fresh-context agent for a satisfied/not-satisfied
   verdict. See the `checker-principle` skill.
4. Only resolve threads the checker actually confirms. Leave the rest open.
5. Batch: verify independent comments in parallel, fix in one pass, run
   one checker pass over all of them together.

## Draft-to-ready

Draft is the correct starting state (per this repo's convention), not the
resting state. CodeRabbit skips draft PRs entirely; human reviewers
generally do too. Once you've applied your own review pass (a hygiene
pass, not a substitute for the checker principle), mark it ready for
review in the same session — call `draft: false` as soon as that pass is
done, not "later."
