# Claude Code Project Configuration

## Agent Restrictions

- **Explore agent is BANNED** - Use `context-gathering` agent instead for codebase exploration tasks

## Session Management

- If you complete a TODO from this file, remove it
- If your session is getting full but more work remains, add a TODO here before ending

## TODOs

- **Version source input**: Add an input that lets users choose how to detect the action version:
  - `git-tag` - Latest git tag (default, GitHub Actions standard)
  - `git-branch` - Current branch name (for bleeding edge users)
  - `git-sha` - Current commit SHA (for exact pinning)
  - `package.json` - Read from package.json version field
  - `explicit` - User provides version directly via `version_override`

  Other versioning considerations for GitHub Actions:
  - GitHub Releases (typically tied to tags)
  - Calver (calendar versioning like `2024.01.15`)
  - Major version tags (`v1`, `v2` that float to latest minor/patch)
