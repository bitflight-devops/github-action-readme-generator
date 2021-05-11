<!-- start title -->

# GitHub Action: 📓 GitHub Action's Readme Generator

<!-- end title -->
<!-- start description -->

This is a CLI tool and GitHub Action that reads in the details from a GitHub Action's `action.yml` file and updates the `README.md` file with the `name`, `description`, `usage`, `inputs`, `outputs`, and examples of the action. Configuration can be provided via a `.ghadocs.json` file stored in the root directory of the Action's repository, via the command line when using the cli, or via the `with:` section of this Action.

This tool uses markdown comments as delimiting tokens within the `README.md` file to determine where to place the generated content.
[`README.example.md`](README.example.md) example with all fields filled in, and no other free-form content.

<!-- end description -->

## TODO

- [x] Add section for a title to the generator
- [x] Add section for a description to the generator
- [x] Add word wrapping to multi line text
- [x] Add section to generate the `action.yml` inputs to a table to the generator
- [x] Add section to generate the `action.yml` outputs to a table to the generator
- [ ] Add a markdown `contents` menu section to the generator
- [ ] Allow for using a separate template for generating the readme file
- [ ] Add section to embed other markdown files, or directories by path, so that documentation can be organised in the file system. <br />
      i.e: `<!-- start [.github/ghdocs/examples/] -->` and `<!-- end [.github/ghdocs/examples/] -->`

<!-- start contents -->
<!-- end contents -->
<!-- start usage -->

```yaml
- uses: bitflight-devops/github-action-readme-generator@main
  with:
    # The absolute or relative path to the `action.yml` file to read in from.
    # Default: action.yml
    action: ''

    # The absolute or relative path to the markdown output file that contains the
    # formatting tokens within it.
    # Default: README.md
    readme: ''

    # The GitHub Action repository owner. i.e: `bitflight-devops`
    owner: ''

    # The GitHub Action repository name. i.e: `github-action-readme-generator`
    repo: ''

    # Save the provided values in a `.ghadocs.json` file. This will update any
    # existing `.ghdocs.json` file that is in place.
    # Default: false
    save: ''
```

<!-- end usage -->
<!-- start inputs -->
<!-- end inputs -->
<!-- start outputs -->
<!-- end outputs -->
<!-- start [.github/ghdocs/examples/] -->
<!-- end [.github/ghdocs/examples/] -->
