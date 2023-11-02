<div align="center" >
<!-- start title -->

# <img src=".github/ghadocs/branding.svg" width="60px" align="center" alt="branding<icon:book-open color:yellow>" /> GitHub Action: GitHub Action's Readme Generator

<!-- end title -->
<!-- start badges -->

<a href="https://github.com/bitflight-devops/github-action-readme-generator/releases/latest"><img src="https://img.shields.io/github/v/release/bitflight-devops/github-action-readme-generator?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release by tag" /></a><a href="https://github.com/bitflight-devops/github-action-readme-generator/releases/latest"><img src="https://img.shields.io/github/release-date/bitflight-devops/github-action-readme-generator?display_name=tag&sort=semver&logo=github&style=flat-square" alt="Release by date" /></a><img src="https://img.shields.io/github/last-commit/bitflight-devops/github-action-readme-generator?logo=github&style=flat-square" alt="Commit" /><a href="https://github.com/bitflight-devops/github-action-readme-generator/issues"><img src="https://img.shields.io/github/issues/bitflight-devops/github-action-readme-generator?logo=github&style=flat-square" alt="Open Issues" /></a><img src="https://img.shields.io/github/downloads/bitflight-devops/github-action-readme-generator/total?logo=github&style=flat-square" alt="Downloads" />

<!-- end badges -->
<br />

</div>
<!-- start description -->

📓 Keep your action's README.md up to date with the `title` and `description` from the [`action.yml`](./action.yml) file, while also automatically generating sections for the inputs, outputs, and a usage example for the action.<br />
Additionally the Action's usage example is updated to match the Action's current release.<br />
This is both a CLI tool and GitHub Action that will read the details from a GitHub Action's [`action.yml`](./action.yml) file. Configuration can be provided through a [`.ghadocs.json`](./.ghadocs.json) file stored in the root directory of the Action's repository, via the command line when using the CLI, or through the `with:` section of this Action.<br />
**_📝 This tool uses markdown comments as delimiting tokens within the README.md file to determine where to place the generated content._**<br />
**_🔗 You can find an example README template with all fields filled-in in the [`README.example.md`](./README.example.md) file._**

<!-- end description -->

## CLI Usage

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
  "prettier": true
}
```

<!-- start contents -->
<!-- end contents -->

## Usage

<!-- start usage -->

```yaml
- uses: bitflight-devops/github-action-readme-generator@v1.7.2
  with:
    # Description: The absolute or relative path to the `action.yml` file to read in
    # from.
    #
    # Default: action.yml
    action: ''

    # Description: The absolute or relative path to the markdown output file that
    # contains the formatting tokens within it.
    #
    # Default: README.md
    readme: ''

    # Description: The GitHub Action repository owner, this field is autodetected by
    # default. Example: `bitflight-devops` or `your-gh-username`
    #
    owner: ''

    # Description: The GitHub Action repository name, this field is autodetected by
    # default. Example: `github-action-readme-generator`
    #
    repo: ''

    # Description: Save the provided values in a `.ghadocs.json` file. This will
    # update any existing `.ghadocs.json` file that is in place.
    #
    # Default: false
    save: ''

    # Description: Use `prettier` to pretty print the new README.md file
    #
    # Default: true
    pretty: ''

    # Description: Enable the update of the usage version to match the latest version
    # in the `package.json` file Output if your action repo is
    # `reviewdog/action-eslint` and version in package.json is 1.0.1:
    # `uses: reviewdog/action-eslint@1.0.1`
    #
    # Default: true
    versioning_enabled: ''

    # Description: Set a specific version to display in the README.md, maybe you want
    # to use a major or minor version
    #
    version_override: ''

    # Description: Prefix the version with this value, if it isn't already prefixed
    #
    # Default: v
    version_prefix: ''

    # Description: If versioning is disabled, use this branch in the usage example,
    # where the default is `main` Output if your action repo is
    # `reviewdog/action-eslint`: `uses: reviewdog/action-eslint@main`
    #
    # Default: main
    versioning_default_branch: ''

    # Description: Add a prefix to the README title. The title template looks like
    # this:
    #
    # # {brand}{prefix}{title}
    #
    # Default: GitHub Action:
    title_prefix: ''

    # Description: Include additional badge showing latest tag
    #
    # Default: true
    include_github_version_badge: ''

    # Description: Create the branding svg image from the branding object in
    # `action.yml` then save it to this path. Then update the `README.md` file to
    # source the branding image from this path. You can use a section template like
    # this: `<!-- start branding --><!-- stop branding -->` or use the action input:
    # `branding_as_title_prefix: true` to prefix the 'title' section with the image.
    # The title template looks like this:
    #
    # # {brand}{prefix}{title}
    #
    # Default: .github/ghadocs/branding.svg
    branding_svg_path: ''

    # Description: Prefix the title in the `<!-- start title -->` section with the svg
    # branding image The title template looks like this:
    #
    # # {brand}{prefix}{title}
    #
    # Default: true
    branding_as_title_prefix: ''
```

<!-- end usage -->

## Inputs

<!-- start inputs -->

| **Input**                                 | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | **Default**                               | **Required** |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------ |
| <code>action</code>                       | The absolute or relative path to the `action.yml` file to read in from.                                                                                                                                                                                                                                                                                                                                                                                                                     | <code>action.yml</code>                   | **false**    |
| <code>readme</code>                       | The absolute or relative path to the markdown output file that contains the formatting tokens within it.                                                                                                                                                                                                                                                                                                                                                                                    | <code>README.md</code>                    | **false**    |
| <code>owner</code>                        | The GitHub Action repository owner, this field is autodetected by default.<br />Example: `bitflight-devops` or `your-gh-username`                                                                                                                                                                                                                                                                                                                                                           |                                           | **false**    |
| <code>repo</code>                         | The GitHub Action repository name, this field is autodetected by default.<br />Example: `github-action-readme-generator`                                                                                                                                                                                                                                                                                                                                                                    |                                           | **false**    |
| <code>save</code>                         | Save the provided values in a `.ghadocs.json` file.<br />This will update any existing `.ghadocs.json` file that is in place.                                                                                                                                                                                                                                                                                                                                                               |                                           | **false**    |
| <code>pretty</code>                       | Use `prettier` to pretty print the new README.md file                                                                                                                                                                                                                                                                                                                                                                                                                                       | <code>true</code>                         | **false**    |
| <code>versioning_enabled</code>           | Enable the update of the usage version to match the latest version in the `package.json` file<br />Output if your action repo is `reviewdog/action-eslint` and version in package.json is 1.0.1:<br />`uses: reviewdog/action-eslint@1.0.1`                                                                                                                                                                                                                                                 | <code>true</code>                         | **false**    |
| <code>version_override</code>             | Set a specific version to display in the README.md, maybe you want to use a major or minor version                                                                                                                                                                                                                                                                                                                                                                                          |                                           | **false**    |
| <code>version_prefix</code>               | Prefix the version with this value, if it isn't already prefixed                                                                                                                                                                                                                                                                                                                                                                                                                            | <code>v</code>                            | **false**    |
| <code>versioning_default_branch</code>    | If versioning is disabled, use this branch in the usage example, where the default is `main`<br />Output if your action repo is `reviewdog/action-eslint`:<br />`uses: reviewdog/action-eslint@main`                                                                                                                                                                                                                                                                                        | <code>main</code>                         | **false**    |
| <code>title_prefix</code>                 | Add a prefix to the README title.<br />The title template looks like this:<br /># {brand}{prefix}{title}                                                                                                                                                                                                                                                                                                                                                                                    | <code>GitHub Action: </code>              | **false**    |
| <code>include_github_version_badge</code> | Include additional badge showing latest tag                                                                                                                                                                                                                                                                                                                                                                                                                                                 | <code>true</code>                         | **false**    |
| <code>branding_svg_path</code>            | Create the branding svg image from the branding object in `action.yml`<br />then save it to this path.<br />Then update the `README.md` file to source the branding image from this path.<br />You can use a section template like this:<br />`<!-- start branding --><!-- stop branding -->`<br />or use the action input:<br />`branding_as_title_prefix: true`<br />to prefix the 'title' section with the image.<br />The title template looks like this:<br /># {brand}{prefix}{title} | <code>.github/ghadocs/branding.svg</code> | **false**    |
| <code>branding_as_title_prefix</code>     | Prefix the title in the `<!-- start title -->` section with the svg branding image<br />The title template looks like this:<br /># {brand}{prefix}{title}                                                                                                                                                                                                                                                                                                                                   | <code>true</code>                         | **false**    |

<!-- end inputs -->
<!-- start outputs -->

| **Output**                 | **Description**                                                      |
| -------------------------- | -------------------------------------------------------------------- |
| <code>sections</code>      | A json object containing a map of section names to their new content |
| <code>readme</code>        | The path to the generated README.md file                             |
| <code>readme_before</code> | The content of the readme file before the changes were made          |
| <code>readme_after</code>  | The content of the readme file after the changes were made           |

<!-- end outputs -->
<!-- start [.github/ghadocs/examples/] -->
<!-- end [.github/ghadocs/examples/] -->
