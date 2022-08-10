<!-- start title -->

# GitHub Action: 📓 GitHub Action's Readme Generator

<!-- end title -->
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

### Example `.ghdocs.json` with all possible values

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
      i.e: `<!-- start [.github/ghdocs/examples/] -->` and `<!-- end [.github/ghdocs/examples/] -->`

<!-- start contents -->
<!-- end contents -->

## Usage

<!-- start usage -->

```yaml
- uses: bitflight-devops/github-action-readme-generator@main
  with:
    # The absolute or relative path to the `action.yml` file to read in from.
    # Default: action.yml
    action: ""

    # The absolute or relative path to the markdown output file that contains the
    # formatting tokens within it.
    # Default: README.md
    readme: ""

    # The GitHub Action repository owner. i.e: `bitflight-devops`|`your-gh-username`
    owner: ""

    # The GitHub Action repository name. i.e: `github-action-readme-generator`
    repo: ""

    # Save the provided values in a `.ghadocs.json` file. This will update any
    # existing `.ghdocs.json` file that is in place.
    save: ""

    # Use `prettier` to pretty print the new README.md file
    pretty: ""

    # Enable the update of the usage version to match the latest version in the
    # `package.json` file
    versioning_enabled: ""

    # Set a specific version to display in the README.md
    version_override: ""

    # Prefix the version with this value (if it isn't already prefixed)
    # Default: v
    version_prefix: ""

    # If versioning is disabled show this branch instead
    # Default: main
    versioning_default_branch: ""

    # Add a prefix to the README title
    # Default: GitHub Action:
    title_prefix: ""
```

<!-- end usage -->

## Inputs

<!-- start inputs -->

| **Input**                       | **Description**                                                                                                         | **Default**       | **Required** |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------ |
| **`action`**                    | The absolute or relative path to the `action.yml` file to read in from.                                                 | `action.yml`      | **false**    |
| **`readme`**                    | The absolute or relative path to the markdown output file that contains the formatting tokens within it.                | `README.md`       | **false**    |
| **`owner`**                     | The GitHub Action repository owner. i.e: `bitflight-devops`&#124;`your-gh-username`                                     |                   | **false**    |
| **`repo`**                      | The GitHub Action repository name. i.e: `github-action-readme-generator`                                                |                   | **false**    |
| **`save`**                      | Save the provided values in a `.ghadocs.json` file. This will update any existing `.ghdocs.json` file that is in place. |                   | **false**    |
| **`pretty`**                    | Use `prettier` to pretty print the new README.md file                                                                   |                   | **false**    |
| **`versioning_enabled`**        | Enable the update of the usage version to match the latest version in the `package.json` file                           |                   | **false**    |
| **`version_override`**          | Set a specific version to display in the README.md                                                                      |                   | **false**    |
| **`version_prefix`**            | Prefix the version with this value (if it isn't already prefixed)                                                       | `v`               | **false**    |
| **`versioning_default_branch`** | If versioning is disabled show this branch instead                                                                      | `main`            | **false**    |
| **`title_prefix`**              | Add a prefix to the README title                                                                                        | `GitHub Action: ` | **false**    |

<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghdocs/examples/] -->
<!-- end [.github/ghdocs/examples/] -->
