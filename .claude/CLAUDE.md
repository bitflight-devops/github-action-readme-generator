# Claude Code Project Configuration

## Agent Restrictions

- **Explore agent is BANNED** - Use `context-gathering` agent instead for codebase exploration tasks

## Session Management

- If you complete a TODO from this file, remove it
- If your session is getting full but more work remains, add a TODO here before ending

## TODOs

- **Restore bold formatting in table first column**: The `rowHeader()` function in `src/helpers.ts` was changed from `<b><code>text</code></b>` to just `<code>text</code>` in commit `0451f2c` (Nov 2023 refactor). Original behavior at commit `2e670c4` had bold first columns. Consider restoring `<b><code>` wrapper.
