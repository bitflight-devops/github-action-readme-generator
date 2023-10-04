#!/usr/bin/env bash
git pull
git fetch --tags
git push --tags
git push

RELEASE_BRANCH="${RELEASE_BRANCH:-main}"
current_branch="$(git branch --show-current)"

if [[ ${current_branch} != "${RELEASE_BRANCH}" ]]; then
  # we want to create a canary release, where we can leave all the files in place.
  true
else
  # we want to create a release branch, where we can delete all the unneeded files
  true
fi
bump="${1:-bui}"
# newtag="$(git semver "${bump}" --dryrun)"
yarntag="$(jq -r '.version' package.json)"
if [[ ${yarntag} != "${newtag#v}" ]]; then
  yarn version -i "${newtag#v}" || true
fi
if yarn build; then
  git add -f dist/ package.json yarn.lock .yarn README.md
  git commit -m "build(release): bump version to ${newtag}" --no-verify
  git semver "${bump}"
else
  echo "build failed"
  exit 1
fi
# newtag2="$(git semver get)"
# stub_major="${newtag%%\.*}"
# stub_major_minor="${newtag%\.*}"

# git tag -d "${stub_major}" 2>/dev/null || true
# git tag -d "${stub_major_minor}" 2>/dev/null || true
# git tag -a "${stub_major}" -m "Release ${newtag}"
# git tag -a "${stub_major_minor}" -m "Release ${newtag}"

# git push origin ":${stub_major}" 2>/dev/null || true
# git push origin ":${stub_major_minor}" 2>/dev/null || true
yarn postversion
yarn release:post
