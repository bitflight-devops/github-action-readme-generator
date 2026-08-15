<div align="center">

<img src=".github/hero.png" alt="GitHub Action README Generator" width="800" />

</div>

<div align="center" >
<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:book-open color:yellow>" /> GitHub Action: GitHub Action's Readme Generator

<!-- end title -->
<!-- start badges -->

<a href="https://github.com/bitflight-devops/github-action-readme-generator/releases/latest"><img src="https://img.shields.io/github/v/release/bitflight-devops/github-action-readme-generator?display_name=tag&amp;sort=semver&amp;logo=github&amp;style=flat-square" alt="Release by tag" /></a><a href="https://github.com/bitflight-devops/github-action-readme-generator/releases/latest"><img src="https://img.shields.io/github/release-date/bitflight-devops/github-action-readme-generator?display_name=tag&amp;sort=semver&amp;logo=github&amp;style=flat-square" alt="Release by date" /></a><img src="https://img.shields.io/github/last-commit/bitflight-devops/github-action-readme-generator?logo=github&amp;style=flat-square" alt="Commit" /><a href="https://github.com/bitflight-devops/github-action-readme-generator/issues"><img src="https://img.shields.io/github/issues/bitflight-devops/github-action-readme-generator?logo=github&amp;style=flat-square" alt="Open Issues" /></a><img src="https://img.shields.io/github/downloads/bitflight-devops/github-action-readme-generator/total?logo=github&amp;style=flat-square" alt="Downloads" />

<!-- end badges -->
<br />

</div>
<!-- start description -->

📓 The docs generator for GitHub Actions. Auto-syncs action.yml → README.md with 8 sections including inputs, outputs, usage, badges & branding. Sensible defaults, highly configurable.

<!-- end description -->

## Quick Start

```sh
npx github-action-readme-generator
```

That's it. Run this in your GitHub Action repository and your README.md is updated.

## Features

|                    | Feature             | Description                                                  |
| :----------------: | ------------------- | ------------------------------------------------------------ |
| :white_check_mark: | **Inputs Table**    | Auto-generates markdown table from `action.yml` inputs       |
| :white_check_mark: | **Outputs Table**   | Auto-generates markdown table from `action.yml` outputs      |
| :white_check_mark: | **Usage Example**   | Creates ready-to-copy YAML workflow snippet                  |
| :white_check_mark: | **Auto-Versioning** | Updates `uses: owner/repo@v1.2.3` on every release           |
| :white_check_mark: | **GitHub Badges**   | Adds release, commit, issues, and download badges            |
| :white_check_mark: | **SVG Branding**    | Generates icon from action.yml branding (100+ icons)         |
| :white_check_mark: | **Easy Setup**      | Add section markers to README, configure via `.ghadocs.json` |
| :white_check_mark: | **Dual Mode**       | Use as CLI (`npx`) or GitHub Action in workflows             |

## How It Works

This tool uses markdown comments as section markers in your README:

```markdown
<!-- start inputs -->
<!-- end inputs -->
```

Run the generator, and content between these markers is automatically updated from your `action.yml`. See [`README.example.md`](./README.example.md) for a complete template.

**Works as both CLI and GitHub Action** - configure via [`.ghadocs.json`](./.ghadocs.json), command line args, or the Action's `with:` section.

### What to expect on your README

Before your first run:

**You add the markers; the tool never inserts them.** A README with no section
markers comes back with nothing filled in — the run still succeeds. Copy the
pairs you want from [`README.example.md`](./README.example.md) first. Only the
sections whose markers you added are touched.

**Text outside the markers is yours and stays yours.** The tool replaces only
the span between a `start`/`end` pair.

**With `pretty` on (the default), the whole file is reformatted.** That is the
one exception to the rule above: prettier runs over the entire README, so a
first run on a file that was not already prettier-formatted will also reflow
prose the tool did not generate. Run with `--pretty=false` if you would rather
it left your formatting alone.

**Only yaml and markdown code blocks are reformatted; every other fence is left
as you wrote it.** Formatting needs a prettier plugin per language, and this tool
ships only the two an action's README is known in advance to hold. Reformatted:
` ```yaml `, ` ```yml `, and the whole markdown family — ` ```markdown `,
` ```md `, ` ```mdx `, and rarer spellings such as ` ```mdwn `, ` ```ronn ` and
` ```workbook `. Returned byte-for-byte: every other language, ` ```ts `,
` ```json `, ` ```css ` and ` ```html ` among them. Every plugin left out is
weight the CLI binary does not carry, and code the tool does not rewrite.
Naming extra plugins per project is
[issue #660](https://github.com/bitflight-devops/github-action-readme-generator/issues/660).

**Check convergence by generating three times and comparing passes 2 and 3.**
Run three consecutive generations without external changes; passes 2 and 3
must be byte-identical. Changes to this convergence rule are owned by
[issue #649](https://github.com/bitflight-devops/github-action-readme-generator/issues/649).

## CLI Usage

Every option can be given by its canonical name or by any of its aliases. The
defaults below are the ones declared in this action's own `action.yml`, so they
apply to the CLI and the Action alike.

| Usage Options                                              | Description                                                                               | Default                        |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------ |
| --help                                                     | Show help                                                                                 | [boolean]                      |
| --paths:action, --action                                   | Path to the action.yml                                                                    | `action.yml`                   |
| --paths:readme, --readme                                   | Path to the README file                                                                   | `README.md`                    |
| --owner                                                    | The GitHub Action repository owner                                                        | autodetected                   |
| --repo                                                     | The GitHub Action repository name                                                         | autodetected                   |
| --prettier, --pretty                                       | Format the markdown using prettier formatter                                              | `true`                         |
| --versioning:enabled, --versioning                         | Enable the update of the usage version to match the latest version                        | `true`                         |
| --versioning:source, --version_source                      | How to detect the version: `git-tag`, `git-branch`, `git-sha`, `package-json`, `explicit` | `git-tag`                      |
| --versioning:override, --version_override, --setversion    | Set a specific version to display in the README.md                                        | unset                          |
| --versioning:prefix, --version_prefix, --vp                | Prefix the version with this value (if it isn't already prefixed)                         | `v`                            |
| --versioning:branch, --versioning_default_branch, --branch | If versioning is disabled show this branch instead                                        | `main`                         |
| --versioning:badge, --version-badge                        | Display the current version as a badge                                                    | `true`                         |
| --title_prefix, --prefix                                   | Add a prefix to the README title                                                          | `"GitHub Action: "`            |
| --branding_svg_path, --svg                                 | Save and load the branding svg image in the README from this path                         | `.github/ghadocs/branding.svg` |
| --branding_as_title_prefix, --branding_prefix              | Use the branding svg as a prefix for the README title                                     | `true`                         |
| --save                                                     | Save this config to `.ghadocs.json`                                                       | `false`                        |
| --debug_config, --debug_nconf                              | Print out the resolved config with all values, then continue                              | off                            |

To turn formatting off, pass the flag explicitly:

```sh
npx github-action-readme-generator --pretty=false
```

### Stand Alone Usage - if you have a Docker Action

```sh
npx --yes github-action-readme-generator@latest
```

### Install with Yarn or NPM as a dev dependency

```sh
yarn add -D github-action-readme-generator
# or
npm i --save-dev github-action-readme-generator
```

### Add a script to your project file

You can modify the script below to include any extra variables you like or use none, and instead use a `.ghadocs.json` file.

```json
{
  "scripts": {
    "ghadocs": "github-action-readme-generator --readme README.md && git add README.md"
  }
}
```

### Using as a Pre-commit Hook

You can automate README generation on every commit by using this tool as a pre-commit hook. This ensures your documentation stays up-to-date automatically.

1. **Install the tool locally** (if you haven't already):

```sh
npm install --save-dev github-action-readme-generator
# or
yarn add -D github-action-readme-generator
```

2. **Configure pre-commit**:

Add the following to your `.pre-commit-config.yaml` file:

```yaml
repos:
  - repo: local
    hooks:
      - id: github-action-readme-generator
        name: Generate README from action.yml
        entry: npx github-action-readme-generator
        language: system
        files: ^(action\.yml|\.ghadocs\.json)$
        pass_filenames: false
```

This configuration will automatically regenerate your README whenever `action.yml` or `.ghadocs.json` changes.

## Configuration

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

### Where a setting can come from, and which one wins

A value can arrive from three places. They resolve in this order, and the first
one holding a key wins:

1. **Command line arguments** — `--pretty=false`
2. **`.ghadocs.json`** — `{ "prettier": false }`
3. **Action inputs** (`INPUT_*` environment variables) — the `with:` block

So when you run this as an Action **and** the repository has a `.ghadocs.json`,
that file wins over your `with:` block for any key it sets. Remove the key from
`.ghadocs.json` to drive it from the workflow instead.

Action inputs sit at the bottom on purpose. The GitHub Actions runner exports an
`INPUT_*` variable for every input that carries a default in `action.yml`,
whether or not your workflow named it under `with:` — so `INPUT_PRETTY` and
`INPUT_README` are set on essentially every run. If those metadata defaults
outranked the config file, a project could not use `.ghadocs.json` to change any
defaulted setting while running as an Action.

Anything left unset after all three falls back to the default in this action's
own `action.yml`, listed in the [CLI Usage](#cli-usage) table above.

To see exactly what was resolved, and from where, run with `--debug_config`
(`--debug_nconf` is an accepted alias). It prints the merged configuration and
then carries on with the run.

That dump is meant to be pasteable into a bug report, so it only prints values
for the keys this tool actually reads. Anything else you supplied — an
unrecognised CLI flag, an extra `.ghadocs.json` entry, an `INPUT_*` variable
from a `with:` key this action does not declare — is shown by name with its
value replaced by `***REDACTED***`. Keys whose names look sensitive (`auth`,
`credential`, `key`, `passw`, `secret`, `token`) are masked the same way.

<!-- start contents -->

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [How It Works](#how-it-works)
  - [What to expect on your README](#what-to-expect-on-your-readme)
- [CLI Usage](#cli-usage)
  - [Stand Alone Usage - if you have a Docker Action](#stand-alone-usage-if-you-have-a-docker-action)
  - [Install with Yarn or NPM as a dev dependency](#install-with-yarn-or-npm-as-a-dev-dependency)
  - [Add a script to your project file](#add-a-script-to-your-project-file)
  - [Using as a Pre-commit Hook](#using-as-a-pre-commit-hook)
- [Configuration](#configuration)
  - [Example `.ghadocs.json` with all possible values](#example-ghadocsjson-with-all-possible-values)
  - [Where a setting can come from, and which one wins](#where-a-setting-can-come-from-and-which-one-wins)
- [Usage](#usage)
- [Inputs](#inputs)

<!-- end contents -->

## Usage

<!-- start usage -->

```yaml
- uses: bitflight-devops/github-action-readme-generator@v1.12.6
  with:
    # Description: The absolute or relative path to the `action.yml` file to read in
    # from.
    #
    # Default: action.yml
    action: ""

    # Description: The absolute or relative path to the markdown output file that
    # contains the formatting tokens within it.
    #
    # Default: README.md
    readme: ""

    # Description: The GitHub Action repository owner, this field is autodetected by
    # default. Example: `bitflight-devops` or `your-gh-username`
    #
    owner: ""

    # Description: The GitHub Action repository name, this field is autodetected by
    # default. Example: `github-action-readme-generator`
    #
    repo: ""

    # Description: Save the provided values in a `.ghadocs.json` file. This will
    # update any existing `.ghadocs.json` file that is in place.
    #
    # Default: false
    save: ""

    # Description: Use `prettier` to pretty print the new README.md file
    #
    # Default: true
    pretty: ""

    # Description: Enable the update of the usage version in the `uses:` example. The
    # version comes from whichever `version_source` selects. The default, `git-tag`,
    # uses the latest git tag, and falls back to `package.json`, then to
    # `$npm_package_version`, then to `0.0.0` when no tag is found — a shallow or
    # tagless checkout takes that path. Output if your action repo is
    # `reviewdog/action-eslint` and the latest tag is `v1.0.1`:
    # `uses: reviewdog/action-eslint@v1.0.1`
    #
    # Default: true
    versioning_enabled: ""

    # Description: Set a specific version to display in the README.md, maybe you want
    # to use a major or minor version
    #
    version_override: ""

    # Description: Prefix the version with this value, if it isn't already prefixed
    #
    # Default: v
    version_prefix: ""

    # Description: If versioning is disabled, use this branch in the usage example,
    # where the default is `main` Output if your action repo is
    # `reviewdog/action-eslint`: `uses: reviewdog/action-eslint@main`
    #
    # Default: main
    versioning_default_branch: ""

    # Description: How to detect the action version for the usage example. Options:
    #
    # - `git-tag` - Latest git tag (default, standard for GitHub Actions). Falls back
    #   to `package.json`, then `$npm_package_version`, then `0.0.0`
    # - `git-branch` - Current branch name (for bleeding edge users)
    # - `git-sha` - Current commit SHA (for exact pinning)
    # - `package-json` - Read from package.json version field
    # - `explicit` - Use value from `version_override` input only
    #
    # Default: git-tag
    version_source: ""

    # Description: Add a prefix to the README title. The title template looks like
    # this:
    #
    # # {brand}{prefix}{title}
    #
    # Default: GitHub Action:
    title_prefix: ""

    # Description: Include additional badge showing latest tag
    #
    # Default: true
    include_github_version_badge: ""

    # Description: Create the branding svg image from the branding object in
    # `action.yml` then save it to this path. Then update the `README.md` file to
    # source the branding image from this path. You can use a section template like
    # this: `<!-- start branding --><!-- end branding -->` or use the action input:
    # `branding_as_title_prefix: true` to prefix the 'title' section with the image.
    # The title template looks like this:
    #
    # # {brand}{prefix}{title}
    #
    # Default: .github/ghadocs/branding.svg
    branding_svg_path: ""

    # Description: Prefix the title in the `<!-- start title -->` section with the svg
    # branding image The title template looks like this:
    #
    # # {brand}{prefix}{title}
    #
    # Default: true
    branding_as_title_prefix: ""
```

<!-- end usage -->

## Inputs

<!-- start inputs -->

| **Input**                                        | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | **Default**                               | **Required** |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------ |
| <b><code>action</code></b>                       | The absolute or relative path to the <code>action.yml</code> file to read in from.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | <code>action.yml</code>                   | **false**    |
| <b><code>readme</code></b>                       | The absolute or relative path to the markdown output file that contains the formatting tokens within it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | <code>README.md</code>                    | **false**    |
| <b><code>owner</code></b>                        | The GitHub Action repository owner, this field is autodetected by default.<br />Example: <code>bitflight-devops</code> or <code>your-gh-username</code>                                                                                                                                                                                                                                                                                                                                                                                                                                |                                           | **false**    |
| <b><code>repo</code></b>                         | The GitHub Action repository name, this field is autodetected by default.<br />Example: <code>github-action-readme-generator</code>                                                                                                                                                                                                                                                                                                                                                                                                                                                    |                                           | **false**    |
| <b><code>save</code></b>                         | Save the provided values in a <code>.ghadocs.json</code> file.<br />This will update any existing <code>.ghadocs.json</code> file that is in place.                                                                                                                                                                                                                                                                                                                                                                                                                                    | <code>false</code>                        | **false**    |
| <b><code>pretty</code></b>                       | Use <code>prettier</code> to pretty print the new README.md file                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | <code>true</code>                         | **false**    |
| <b><code>versioning_enabled</code></b>           | Enable the update of the usage version in the <code>uses:</code> example.<br />The version comes from whichever <code>version_source</code> selects. The default, <code>git-tag</code>, uses the latest git tag, and falls back to <code>package.json</code>, then to <code>$npm_package_version</code>, then to <code>0.0.0</code> when no tag is found — a shallow or tagless checkout takes that path.<br />Output if your action repo is <code>reviewdog/action-eslint</code> and the latest tag is <code>v1.0.1</code>:<br /><code>uses: reviewdog/action-eslint@v1.0.1</code>    | <code>true</code>                         | **false**    |
| <b><code>version_override</code></b>             | Set a specific version to display in the README.md, maybe you want to use a major or minor version                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |                                           | **false**    |
| <b><code>version_prefix</code></b>               | Prefix the version with this value, if it isn't already prefixed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | <code>v</code>                            | **false**    |
| <b><code>versioning_default_branch</code></b>    | If versioning is disabled, use this branch in the usage example, where the default is <code>main</code><br />Output if your action repo is <code>reviewdog/action-eslint</code>:<br /><code>uses: reviewdog/action-eslint@main</code>                                                                                                                                                                                                                                                                                                                                                  | <code>main</code>                         | **false**    |
| <b><code>version_source</code></b>               | How to detect the action version for the usage example.<br />Options:<br />- <code>git-tag</code> - Latest git tag (default, standard for GitHub Actions). Falls back to <code>package.json</code>, then <code>$npm_package_version</code>, then <code>0.0.0</code><br />- <code>git-branch</code> - Current branch name (for bleeding edge users)<br />- <code>git-sha</code> - Current commit SHA (for exact pinning)<br />- <code>package-json</code> - Read from package.json version field<br />- <code>explicit</code> - Use value from <code>version_override</code> input only | <code>git-tag</code>                      | **false**    |
| <b><code>title_prefix</code></b>                 | Add a prefix to the README title.<br />The title template looks like this:<br /># {brand}{prefix}{title}                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | <code>GitHub Action: </code>              | **false**    |
| <b><code>include_github_version_badge</code></b> | Include additional badge showing latest tag                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | <code>true</code>                         | **false**    |
| <b><code>branding_svg_path</code></b>            | Create the branding svg image from the branding object in <code>action.yml</code><br />then save it to this path.<br />Then update the <code>README.md</code> file to source the branding image from this path.<br />You can use a section template like this:<br /><code>\<!-- start branding -->\<!-- end branding --></code><br />or use the action input:<br /><code>branding_as_title_prefix: true</code><br />to prefix the 'title' section with the image.<br />The title template looks like this:<br /># {brand}{prefix}{title}                                               | <code>.github/ghadocs/branding.svg</code> | **false**    |
| <b><code>branding_as_title_prefix</code></b>     | Prefix the title in the <code>\<!-- start title --></code> section with the svg branding image<br />The title template looks like this:<br /># {brand}{prefix}{title}                                                                                                                                                                                                                                                                                                                                                                                                                  | <code>true</code>                         | **false**    |

<!-- end inputs -->
<!-- start outputs -->

| **Output**                        | **Description**                                                      | **Value** |
| --------------------------------- | -------------------------------------------------------------------- | --------- |
| <b><code>sections</code></b>      | A json object containing a map of section names to their new content |           |
| <b><code>readme</code></b>        | The path to the generated README.md file                             |           |
| <b><code>readme_before</code></b> | The content of the readme file before the changes were made          |           |
| <b><code>readme_after</code></b>  | The content of the readme file after the changes were made           |           |

<!-- end outputs -->

**NOTE**: [volta.sh](https://volta.sh/) is a great tool for managing node versions, and is configured in this directory. If you have volta installed, you can run `volta install` to install the correct version of node for this project.

<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->

---

<div align="center">

<img src=".github/bitflight-devops.png" alt="Bitflight DevOps" width="400" />

**Built by [Bitflight DevOps](https://github.com/bitflight-devops)**

</div>
