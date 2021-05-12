import * as core from '@actions/core'
import {Context} from '@actions/github/lib/context'
import * as fs from 'fs'
import * as nconf from 'nconf'
import * as path from 'path'

import Action from './Action'
import {repositoryFinder} from './helpers'
import LogTask from './logtask'
import {workingDirectory} from './working-directory'

const log = new LogTask('inputs')
process.chdir(workingDirectory())
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

nconf.use('file', {file: '.ghadocs.json', dir: workingDirectory(), search: true})
nconf
  .argv({
    save: {
      alias: 'save',
      describe: 'Save this config to .ghadocs.json',
      parseValues: true
    },
    'paths:action': {
      alias: 'action',
      describe: 'Path to the action.yml',
      parseValues: true
    },
    'paths:readme': {
      alias: 'readme',
      describe: 'Path to the README.md',
      parseValues: true
    },
    show_logo: {
      alias: 'logo',
      describe: "Display the action's logo in the README",
      parseValues: true
    },
    owner: {
      alias: 'owner',
      describe: 'The GitHub Action repository owner. i.e: `bitflight-devops`',
      parseValues: true
    },
    repo: {
      alias: 'repo',
      describe: 'The GitHub Action repository name. i.e: `github-action-readme-generator`',
      parseValues: true
    },
    prettier: {
      alias: 'pretty',
      describe: 'Format the markdown using prettier formatter',
      parseValues: true
    },
    'versioning:enabled': {
      alias: 'versioning',
      describe: 'Enable the update of the usage version to match the latest version in the package.json file',
      parseValues: true
    },
    'versioning:override': {
      alias: 'version',
      describe: 'Set a specific version to display in the README.md',
      parseValues: true
    },
    'versioning:prefix': {
      alias: 'vp',
      describe: "Prefix the version with this value (if it isn't already prefixed)",
      parseValues: true
    },
    'versioning:branch': {
      alias: 'branch',
      describe: 'If versioning is disabled show this branch instead',
      parseValues: true
    },
    title_prefix: {
      alias: 'prefix',
      describe: 'Add a prefix to the README title',
      parseValues: true
    }
  })
  .defaults({
    save: core.getInput('save') ?? 'true',
    'paths:action': core.getInput('action') ?? 'action.yml',
    'paths:readme': core.getInput('readme') ?? 'README.md',
    owner: process.env.INPUT_OWNER ?? repositryDetail.owner ?? undefined,
    repo: process.env.INPUT_REPO ?? repositryDetail.repo ?? undefined,
    show_logo: core.getInput('logo') ?? 'true',
    pretty: core.getInput('pretty') ?? 'true',
    'versioning:enabled': core.getInput('versioning_enabled') ?? true,
    'versioning:override': core.getInput('versioning_overide') ?? '',
    'versioning:prefix': core.getInput('version_prefix') ?? 'v',
    'versioning:branch': core.getInput('versioning_default_branch') ?? 'main',
    title_prefix: core.getInput('title_prefix') ?? 'GitHub Action: ',
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

for (const k of configKeys) {
  log.debug(`${k}: ${nconf.get(k) as string}`)
}

export const sections = nconf.get('sections') as string[]
export const readmePath = path.resolve(workingDirectory(), nconf.get('paths:readme') as string)
const actionPath = path.resolve(workingDirectory(), nconf.get('paths:action') as string)
export const action = new Action(actionPath)
