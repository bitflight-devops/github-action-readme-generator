### Example `.ghadocs.json` with all possible values

```json
{
  "paths": {
    "action": "action.yml",
    "readme": "README.md"
  },
  "versioning": {
    "enabled": true,
    "source": "git-tag",
    "override": "",
    "prefix": "v",
    "branch": "main",
    "badge": true
  },
  "owner": "bitflight-devops",
  "repo": "github-action-readme-generator",
  "title_prefix": "GitHub Action: ",
  "branding_svg_path": ".github/ghadocs/branding.svg",
  "branding_as_title_prefix": true,
  "prettier": true
}
```

These keys are the canonical CLI option names, nested where the CLI writes `:` —
`versioning.prefix` is `--versioning:prefix`. Several are spelled differently
from the equivalent Action input: `prettier` is the `pretty` input,
`versioning.badge` is `include_github_version_badge`, `versioning.override` is
`version_override`, `versioning.branch` is `versioning_default_branch`, and
`paths.action`/`paths.readme` are `action`/`readme`. The README's CLI Usage
table lists every canonical name with its aliases.

This file outranks the Action's `with:` block for every key it sets — see
"Where a setting can come from, and which one wins" in the README.
