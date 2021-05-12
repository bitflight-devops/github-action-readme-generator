import * as core from '@actions/core'
import {Context} from '@actions/github/lib/context'
import * as fs from 'fs'
import * as nconf from 'nconf'

import {repositoryFinder} from './helpers'

const githubEventPath = process.env.GITHUB_EVENT_PATH
let githubEvent = null
try {
  githubEvent = JSON.parse(fs.readFileSync(githubEventPath, 'utf8')) as Context
} catch (err) {
  // File not there
}
const repositryDetail = repositoryFinder(null, githubEvent)

export const configKeys: string[] = [
  'paths:action',
  'paths:readme',
  'show_logo',
  'versioning:enabled',
  'versioning:override',
  'versioning:prefix',
  'owner',
  'repo',
  'versioning:branch',
  'title_prefix',
  'pretty'
]

nconf.use('file', {file: '.ghadocs.json', dir: process.cwd(), search: true})
nconf
  .argv({
    save: {
      alias: 'save',
      describe: 'Save this config to .ghadocs.json',
      default: core.getInput('save') === 'true',
      parseValues: true
    },
    'paths:action': {
      alias: 'action',
      describe: 'Path to the action.yml',
      default: core.getInput('action') ?? 'action.yml',
      parseValues: true
    },
    'paths:readme': {
      alias: 'readme',
      describe: 'Path to the README.md',
      default: core.getInput('readme') ?? 'README.md',
      parseValues: true
    },
    show_logo: {
      alias: 'logo',
      describe: "Display the action's logo in the README",
      default: core.getInput('logo') === 'true',
      parseValues: true
    },
    owner: {
      alias: 'owner',
      describe: 'The GitHub Action repository owner. i.e: `bitflight-devops`',
      default: core.getInput('owner'),
      parseValues: true
    },
    repo: {
      alias: 'repo',
      describe: 'The GitHub Action repository name. i.e: `github-action-readme-generator`',
      default: core.getInput('repo'),
      parseValues: true
    },
    prettier: {
      alias: 'pretty',
      describe: 'Format the markdown using prettier formatter',
      default: core.getInput('pretty') === 'true',
      parseValues: true
    },
    'versioning:enabled': {
      alias: 'versioning',
      describe: 'Enable the update of the usage version to match the latest version in the package.json file',
      default: core.getInput('versioning_enabled') === 'true',
      parseValues: true
    },
    'versioning:override': {
      alias: 'version',
      describe: 'Set a specific version to display in the README.md',
      default: core.getInput('version_override') ?? '',
      parseValues: true
    },
    'versioning:prefix': {
      alias: 'vp',
      describe: "Prefix the version with this value (if it isn't already prefixed)",
      default: core.getInput('version_prefix') ?? 'v',
      parseValues: true
    },
    'versioning:branch': {
      alias: 'branch',
      describe: 'If versioning is disabled show this branch instead',
      default: core.getInput('versioning_default_branch') ?? 'main',
      parseValues: true
    },
    title_prefix: {
      alias: 'prefix',
      describe: 'Add a prefix to the README title',
      default: core.getInput('title_prefix') ?? 'GitHub Action: ',
      parseValues: true
    }
  })
  .defaults({
    owner: process.env.INPUT_OWNER ?? repositryDetail.owner ?? undefined,
    repo: process.env.INPUT_REPO ?? repositryDetail.repo ?? undefined,
    sections: [
      'title',
      'description',
      'usage',
      'inputs',
      'outputs',
      'contributors',
      'examples',
      'references',
      'changelog',
      'contents'
    ]
  })
  .required(['owner', 'repo'])

export const sections = nconf.get('sections') as string[]
export const readmePath = nconf.get('paths:readme') as string
export const actionPath = nconf.get('paths:action') as string
