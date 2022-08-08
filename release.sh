#!/usr/bin/env bash
git fetch --tags

bump="${1:-patch}"
newtag="$(git semver "${bump}" --dryrun)"
yarntag="$(jq -r '.version' package.json)"
if [[ ${yarntag} != "${newtag#v}" ]]; then
yarn version -i "${newtag}" || true
yarn build
fi

git add dist package.json yarn.lock .yarn
git commit -m "chore(release): bump version to ${newtag}" --no-verify
git semver "${bump}"
newtag2="$(git semver get)"
if [[ "${newtag}" != "${newtag2}" ]]; then
  echo "ERROR: new tag does not match expected tag"
  echo "  expected: ${newtag}"
  echo "  actual:   ${newtag2}"
  exit 1
fi

stub_major="${newtag%%\.*}"
stub_major_minor="${newtag%\.*}"
git tag -d "${stub_major}"
git tag -d "${stub_major_minor}"
git tag -a "${stub_major}" -m "Release ${newtag}"
git tag -a "${stub_major_minor}" -m "Release ${newtag}"
git push origin ":${stub_major}"
git push origin ":${stub_major_minor}"
git push --tags
git push
