<!-- start title -->

# GitHub Action: 📓 GitHub Action's Readme Generator

<!-- end title -->
<!-- start badges -->

<a href="https://github.com/bitflight-devops/github-action-readme-generator/releases/latest"><img src="https://img.shields.io/github/v/release/bitflight-devops/github-action-readme-generator?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release" /></a><a href="https://github.com/bitflight-devops/github-action-readme-generator/releases/latest"><img src="https://img.shields.io/github/release-date/bitflight-devops/github-action-readme-generator?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release" /></a><img src="https://img.shields.io/github/last-commit/bitflight-devops/github-action-readme-generator?logo=github&style=flat-square" alt="Commit" /><a href="https://github.com/bitflight-devops/github-action-readme-generator/issues"><img src="https://img.shields.io/github/issues/bitflight-devops/github-action-readme-generator?logo=github&style=flat-square" alt="Open Issues" /></a><img src="https://img.shields.io/github/downloads/bitflight-devops/github-action-readme-generator/total?logo=github&style=flat-square" alt="Downloads" />

<!-- end badges -->
<!-- start description -->

Maintain a current README.md with content from the action.yml file

<!-- end description -->

This is a CLI tool and GitHub Action that reads in the details from a GitHub Action's `action.yml` file and updates the `README.md` file with the `name`, `description`, `usage`, `inputs`, `outputs`, and examples of the action. Configuration can be provided via a `.ghadocs.json` file stored in the root directory of the Action's repository, via the command line when using the cli, or via the `with:` section of this Action.

This tool uses markdown comments as delimiting tokens within the `README.md` file to determine where to place the generated content.
[`README.example.md`](README.example.md) example with all fields filled in, and no other free-form content.

## CLI usage

| Usage Options                      | Description                                                                                 | Default          |
| ---------------------------------- | ------------------------------------------------------------------------------------------- | ---------------- |
| --help                             | Show help                                                                                   | [boolean]        |
| --paths:action, --action           | Path to the action.yml                                                                      | [default: ""]    |
| --paths:readme, --readme           | Path to the README.md                                                                       | [default: ""]    |
| --show_logo, --logo                | Display the action's logo in the README                                                     | [default: false] |
| --prettier, --pretty               | Format the markdown using prettier formatter                                                | [default: false] |
| --versioning:enabled, --versioning | Enable the update of the usage version to match the latest version in the package.json file | [default: false] |
| --versioning:override, --version   | Show version number[boolean]                                                                | [default: ""]    |
| --versioning:prefix, --vp          | Prefix the version with this value (if it isn't already prefixed)                           | [default: ""]    |
| --versioning:branch, --branch      | If versioning is disabled show this branch instead                                          | [default: ""]    |
| --title_prefix, --prefix           | Add a prefix to the README title                                                            | [default: ""]    |

### Stand Alone Usage - if you have a Docker Action

```sh
npx github-action-readme-generator
```

### Install with Yarn or NPM as a dev dependency

```sh
yarn add -D github-action-readme-generator
# or
npm i --save-dev github-action-readme-generator
```

### Add a script to your project file

You can modify the script below to include any extra variables you like
or use none, and instead use a `.ghadocs.json` file.

```json
{
  "scripts": {
    "ghadocs": "github-action-readme-generator --readme README.md && git add README.md"
  }
}
```

## Configuration

### Example `.ghadocs.json` with all possible values

```json
{
  "paths": {
    "action": "action.yml",
    "readme": "README.md"
  },
  "show_logo": true,
  "versioning": {
    "enabled": true,
    "override": "",
    "prefix": "v",
    "branch": "main"
  },
  "owner": "bitflight-devops",
  "repo": "github-action-readme-generator",
  "title_prefix": "GitHub Action: ",
  "pretty": true
}
```

## TODO

- [x] Add section for a title to the generator
- [x] Add section for a description to the generator
- [x] Add word wrapping to multi line text
- [x] Add section to generate the `action.yml` inputs to a table to the generator
- [x] Add section to generate the `action.yml` outputs to a table to the generator
- [ ] Add a markdown `contents` menu section to the generator
- [ ] Allow for using a separate template for generating the readme file
- [ ] Add section to embed other markdown files, or directories by path, so that documentation can be organized in the file system. <br />
      i.e: `<!-- start [.github/ghadocs/examples/] -->` and `<!-- end [.github/ghadocs/examples/] -->`

<!-- start contents -->
<!-- end contents -->

## Usage

<!-- start usage -->

```yaml
- uses: bitflight-devops/github-action-readme-generator@v1.3.15--canary.bb744e8.0
  with:
    # The absolute or relative path to the `action.yml` file to read in from.
    # Default: action.yml
    action: ''

    # The absolute or relative path to the markdown output file that contains the
    # formatting tokens within it.
    # Default: README.md
    readme: ''

    # The GitHub Action repository owner. i.e: `bitflight-devops`|`your-gh-username`
    owner: ''

    # The GitHub Action repository name. i.e: `github-action-readme-generator`
    repo: ''

    # Save the provided values in a `.ghadocs.json` file. This will update any
    # existing `.ghadocs.json` file that is in place.
    save: ''

    # Use `prettier` to pretty print the new README.md file
    pretty: ''

    # Enable the update of the usage version to match the latest version in the
    # `package.json` file
    versioning_enabled: ''

    # Set a specific version to display in the README.md
    version_override: ''

    # Prefix the version with this value (if it isn't already prefixed)
    # Default: v
    version_prefix: ''

    # If versioning is disabled show this branch instead
    # Default: main
    versioning_default_branch: ''

    # Add a prefix to the README title
    # Default: GitHub Action:
    title_prefix: ''

    # Include additional badge showing latest tag
    # Default: true
    include_github_version_badge: ''
```

<!-- end usage -->

## Inputs

<!-- start inputs -->

| \***\*Input\*\***                             | \***\*Description\*\***                                                                                                                        | \***\*Default\*\***          | \***\*Required\*\*** |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------- |
| **<code>action</code>**                       | The absolute or relative path to the <code>action.yml</code> file to read in from.                                                             | <code>action.yml</code>      | **false**            |
| **<code>readme</code>**                       | The absolute or relative path to the markdown output file that contains the formatting tokens within it.                                       | <code>README.md</code>       | **false**            |
| **<code>owner</code>**                        | The GitHub Action repository owner. i.e: `bitflight-devops`\|`your-gh-username`                                                                |                              | **false**            |
| **<code>repo</code>**                         | The GitHub Action repository name. i.e: <code>github-action-readme-generator</code>                                                            |                              | **false**            |
| **<code>save</code>**                         | Save the provided values in a <code>.ghadocs.json</code> file. This will update any existing <code>.ghadocs.json</code> file that is in place. |                              | **false**            |
| **<code>pretty</code>**                       | Use <code>prettier</code> to pretty print the new README.md file                                                                               |                              | **false**            |
| **<code>versioning_enabled</code>**           | Enable the update of the usage version to match the latest version in the <code>package.json</code> file                                       |                              | **false**            |
| **<code>version_override</code>**             | Set a specific version to display in the README.md                                                                                             |                              | **false**            |
| **<code>version_prefix</code>**               | Prefix the version with this value (if it isn't already prefixed)                                                                              | <code>v</code>               | **false**            |
| **<code>versioning_default_branch</code>**    | If versioning is disabled show this branch instead                                                                                             | <code>main</code>            | **false**            |
| **<code>title_prefix</code>**                 | Add a prefix to the README title                                                                                                               | <code>GitHub Action: </code> | **false**            |
| **<code>include_github_version_badge</code>** | Include additional badge showing latest tag                                                                                                    | <code>true</code>            | **false**            |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
