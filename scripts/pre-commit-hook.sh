#!/bin/sh
set -eu

if ! command -v node >/dev/null 2>&1 || ! command -v npx >/dev/null 2>&1; then
  echo "github-action-readme-generator pre-commit hook requires Node.js and npm/npx." >&2
  exit 1
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
package_json="$script_dir/../package.json"
version=$(node -e 'const fs = require("node:fs"); const p = JSON.parse(fs.readFileSync(process.argv[1], "utf8")); process.stdout.write(p.version);' "$package_json")

exec npx --yes "github-action-readme-generator@$version" "$@"
