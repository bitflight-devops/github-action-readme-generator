#!/bin/sh
set -eu

if ! command -v node >/dev/null 2>&1; then
  echo "github-action-readme-generator pre-commit hook requires Node.js." >&2
  exit 1
fi

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cli="$script_dir/../dist/bin/index.js"

if [ ! -f "$cli" ]; then
  echo "github-action-readme-generator bundled CLI is missing; use a published release tag." >&2
  exit 1
fi

exec node "$cli" "$@"
