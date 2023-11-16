export const actTestYmlPath = './action.test.yml';

export const actionTestString = `name: Test Action
author: Test Author
description: Test Description
branding:
  color: white
  icon: activity
inputs:
  input1:
    description: Test Input 1
    required: true
    default: default1
  input2:
    description: Test Input 2
outputs:
  output1:
    description: Test Output 1
runs:
  using: container
  image: test-image
  main: test-main
  pre: test-pre
`;

export const ghadocsTestString = `{
  "owner": "user-from-config",
  "repo": "repo-from-config",
  "paths": {
    "action": "action.test-config.yml",
    "readme": "README.test-config.md"
  },
  "branding_svg_path": ".github/ghadocs/branding-config.svg",
  "versioning": {
    "enabled": true,
    "prefix": "config",
    "override": "",
    "branch": "config"
  }
}
`;
export const gitConfigTestString = `[remote "origin"]
url = https://github.com/ownergit/repogit.git
`;

export const payloadTestString = `{
  "action": "opened",
  "repository": {
    "owner": {
      "login": "userpayload"
    },
    "name": "testpayload"
  },
  "issue": {
    "number": 1
  },
  "sender": {
    "type": "User"
  }
}`;
