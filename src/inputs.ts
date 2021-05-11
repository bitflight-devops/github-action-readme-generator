import * as nconf from 'nconf'

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
      default: false,
      parseValues: true
    },
    'paths:action': {
      alias: 'action',
      describe: 'Path to the action.yml',
      default: 'action.yml',
      parseValues: true
    },
    'paths:readme': {
      alias: 'readme',
      describe: 'Path to the README.md',
      default: 'README.md',
      parseValues: true
    },
    show_logo: {
      alias: 'logo',
      describe: "Display the action's logo in the README",
      default: true,
      parseValues: true
    },
    prettier: {
      alias: 'pretty',
      describe: 'Format the markdown using prettier formatter',
      default: true,
      parseValues: true
    },
    'versioning:enabled': {
      alias: 'versioning',
      describe: 'Enable the update of the usage version to match the latest version in the package.json file',
      default: true,
      parseValues: true
    },
    'versioning:override': {
      alias: 'version',
      describe: 'Set a specific version to display in the README.md',
      default: '',
      parseValues: true
    },
    'versioning:prefix': {
      alias: 'vp',
      describe: "Prefix the version with this value (if it isn't already prefixed)",
      default: 'v',
      parseValues: true
    },
    'versioning:branch': {
      alias: 'branch',
      describe: 'If versioning is disabled show this branch instead',
      default: 'main',
      parseValues: true
    },
    title_prefix: {
      alias: 'prefix',
      describe: 'Add a prefix to the README title',
      default: 'GitHub Action: ',
      parseValues: true
    }
  })
  .env()
  .defaults({
    paths: {
      action: 'action.yml',
      readme: 'README.md',
      changelog: 'CHANGELOG.md',
      examples: '.github/examples/'
    },
    versioning: {
      enabled: true,
      prefix: 'v',
      override: ''
    },
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
