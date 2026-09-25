# The tool's contract

What this generator promises and what it does not. Written for contributors and
AI agents: read this before changing generation behaviour or writing a test that
asserts what the output "should" look like.

**Durable design only.** Where a live defect changes how you must write code
today, state the rule and link its issue, never the bug — the "Working
discipline" rule in `AGENTS.md`. Convergence, below, is the one instance.

## Mission, in one paragraph

A one-way projector: it reads `action.yml` plus a config cascade, renders a
fixed set of views of that metadata, and splices each into the matching
`<!-- start X -->…<!-- end X -->` pair of a target README. Nothing flows back
the other way. It runs both as a CLI and as a GitHub Action, against its own
repository and against arbitrary third-party ones.

## Content outside the markers is the user's, not ours

Everything the tool does rests on this. A change that rewrites text outside a
marker pair is a breaking change even if every test passes.

Treat marker boundaries as ownership boundaries for what the _generator_
writes: every span it composes goes between a pair, and no new behaviour may
depend on whole-document formatting. Prettier is held to the same boundary.
`readme-editor.ts` extracts each span it replaced, formats that text on its
own, and splices the result back, so the bytes outside a pair come through
untouched at either `pretty` setting. `pretty` decides whether the generated
spans are formatted, nothing wider.

Two consequences for the formatter. Each span is formatted with no knowledge of
the rest of the document, so nothing it produces may depend on surrounding
content — a table's column padding is computed from that table alone. And a
README this tool has never touched stays as its author left it, however
unformatted: a first run's diff covers the spans and no other line.

Generated spans take the document's line ending. A README that is CRLF
throughout is edited as LF in memory and written back as CRLF, which round-trips
every byte outside the markers exactly. A README that mixes the two keeps its
bytes, and its spans are written as LF, because no single ending reproduces it.

Which bytes are a span is a separate question, decided by marker pairing rather
than by the formatter. `getTokenIndexes` pairs the last start marker in the
document with the last end marker in the document, so a repeated marker after a
real pair moves one of the two boundaries — a repeated end marker widens the
span past its end marker, and a repeated start marker moves the start instead
([#691](https://github.com/bitflight-devops/github-action-readme-generator/issues/691)).
Code against the pairing that rule gives you until it is fixed.

## What is guaranteed, and what is prettier's

The generator's own output is deliberately plain; nearly everything that makes
the committed README _look_ tidy comes from prettier afterwards.

| Property                                                                           | Source                                              |
| ---------------------------------------------------------------------------------- | --------------------------------------------------- |
| Marker text preserved; only the span between a pair is replaced                    | this tool (`readme-editor.ts`)                      |
| Inputs/outputs rows in `action.yml` declaration order                              | this tool                                           |
| Cell escaping: `\|`→`\\\|`, newline→`<br />`, backticks→`<code>`, `><!--`→`>\<!--` | this tool (`markdowner/index.ts`)                   |
| First column rendered `<b><code>name</code></b>`                                   | this tool                                           |
| Usage values emitted as `key: ''` (single quotes)                                  | this tool (`update-usage.ts`)                       |
| Optional inputs marked `__false__`                                                 | this tool (`update-inputs.ts`)                      |
| **Table column padding and alignment**                                             | **prettier** — the generator emits `\|---\|---\|`   |
| **`__false__` rendered as `**false**`**                                            | **prettier**                                        |
| **`key: ''` rendered as `key: ""`**                                                | **prettier**, and only when the fence is valid YAML |
| **Trailing whitespace trimmed**                                                    | **prettier**                                        |
| **Formatting of the generated spans, and of nothing outside them**                 | **prettier**, and only with `pretty` on             |

Practical consequence for tests: asserting padded table delimiters, `**false**`,
or double-quoted YAML values is asserting _prettier's_ behaviour. Against a
third-party README those assertions prove nothing, because that repository may
already run prettier itself. `scripts/verify-readme-contract.mjs` deliberately
asserts none of them; `__tests__/integration-readme-contract.test.ts` does
assert padding, and can only do so because its fixture starts as bare markers.

What the verifier does assert about the formatter is its scope, and it asks
only the original where the boundaries are. It cuts the original into the
chunks outside its section spans, each carrying the markers that bound it, then
walks the generated README: those chunks, in order, one generated span between
each neighbouring pair, nothing left over. Asking the generated document where
its own markers are is what would measure a run against a boundary that run had
moved — a swallowed paragraph or a duplicated tail would then sit inside the
span and go unseen. In the walk they have nowhere to go.

A marker the generation writes into a span is reported separately, because it
competes to be that section's boundary on the next run. It fails the check when
that section has a pair to steal, and is a warning when it has none.

## Convergence uses passes 2 and 3

Run three consecutive generations without external changes and compare passes
2 and 3. They must be byte-identical. A pass-1 difference may be reported for
visibility, but does not decide convergence. Changes to this rule are owned by
[#649](https://github.com/bitflight-devops/github-action-readme-generator/issues/649).

## Version resolution

Every git command runs in `path.dirname(action.yml)`, not the working
directory. `versioning:source` (default `git-tag`) selects the strategy:

- `git-tag` — `git describe --tags --abbrev=0`, then `package.json`, then
  `npm_package_version`, then `0.0.0`. **This is the only source with a
  fallback chain.**
- `package-json`, `git-branch`, `git-sha` — no fallback; straight to `0.0.0`.
- `explicit` — `versioning:override`, else `0.0.0`.

A non-empty `versioning:override` overrides whatever was detected, for every
source. The `versioning:prefix` (default `v`) is applied except for
`git-branch` and `git-sha`.

Run `git fetch --tags` before generating, and read the version the run reports
(grep the run's output for `Version string:` — the log's bracketed fields are
padded to a shared width). `actions/checkout` produces a shallow,
tagless clone by default, and an incomplete tag set resolves to a real but older
tag while a fully tagless one walks the chain to `0.0.0` — neither says so
(#667).

## Running against third-party repositories

This is the case the tool exists for and the case least covered by unit tests;
`.github/workflows/integration-test.yml` is what exercises it.

- `GITHUB_REPOSITORY` names the **workflow's** repo, not the one being
  documented. Never resolve owner/repo from it, or from `process.cwd()`.
- `actions/checkout` produces a shallow clone with no tags, and writes remote
  URLs without a `.git` suffix.
- Zero-input and zero-output actions are ordinary third-party shapes, not edge
  cases.

## Published bundles are self-contained

A GitHub Actions runner gives this action no `node_modules` of its own. Every
runtime dependency must be present in the published bundle; `npm run build`
passing and the local test suite passing do not prove that contract.

**Before changing anything about bundling: run the built binary from a
directory with no `node_modules`.** `__tests__/integration-bundled-binary.test.ts`
is the guard for this.
