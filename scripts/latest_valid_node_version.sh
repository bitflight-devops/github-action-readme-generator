#!/usr/bin/env bash
set -e -o pipefail

# Check if the node version is compatible with the engine
#
ENGINE_RANGE="$(jq -r '.engines.node' package.json)"
npm view node@"${ENGINE_RANGE}" version | sort | tail -1 | awk '{gsub(/'\''/,"", $2);print $2;}'

