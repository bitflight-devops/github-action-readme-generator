#!/usr/bin/env bash
git fetch --tags

bump="${1:-patch}"
newtag="$(git semver "${bump}" --dryrun)"
yarntag="$(jq -r '.version' package.json)"
if [[ ${yarntag} != "${newtag#v}" ]]; then
yarn version -i "${newtag#v}" || true
fi
yarn build
git add dist package.json yarn.lock .yarn
git commit -m "chore(release): bump version to ${newtag}" --no-verify
git semver "${bump}"

newtag2="$(git semver get)"
stub_major="${newtag%%\.*}"
stub_major_minor="${newtag%\.*}"
git tag -d "${newtag2}" 2>/dev/null || true
git tag -d "${stub_major}" 2>/dev/null || true
git tag -d "${stub_major_minor}" 2>/dev/null || true
git tag -a "${stub_major}" -m "Release ${newtag}"
git tag -a "${stub_major_minor}" -m "Release ${newtag}"
git push origin ":${newtag2}" 2>/dev/null || true
git push origin ":${stub_major}" 2>/dev/null || true
git push origin ":${stub_major_minor}" 2>/dev/null || true
yarn postversion
git push
yarn release:post
