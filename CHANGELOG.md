## [1.12.3](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.12.2...v1.12.3) (2026-08-15)


### Bug Fixes

* **cli:** parse sections as an array ([#665](https://github.com/bitflight-devops/github-action-readme-generator/issues/665)) ([9d6c0a2](https://github.com/bitflight-devops/github-action-readme-generator/commit/9d6c0a23a7f246f1e165df859e3c2c58d5772664))

## [1.12.2](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.12.1...v1.12.2) (2026-08-15)


### Bug Fixes

* **versioning:** default disabled usage ref to main ([#662](https://github.com/bitflight-devops/github-action-readme-generator/issues/662)) ([93a624e](https://github.com/bitflight-devops/github-action-readme-generator/commit/93a624eb8f5071843dc1d82abd36ec18e586ed33)), closes [#637](https://github.com/bitflight-devops/github-action-readme-generator/issues/637)

## [1.12.1](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.12.0...v1.12.1) (2026-08-15)


### Bug Fixes

* **badges:** preserve links and readable alt text ([#661](https://github.com/bitflight-devops/github-action-readme-generator/issues/661)) ([089cd7c](https://github.com/bitflight-devops/github-action-readme-generator/commit/089cd7c561f11a46c0fabad26a3bf33ebfc76105)), closes [#636](https://github.com/bitflight-devops/github-action-readme-generator/issues/636)

# [1.12.0](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.11.0...v1.12.0) (2026-08-09)


### Features

* **lint:** migrate to Oxlint/Vite+, retire Biome (Phase 2 of TS7/Vite+ plan) ([#628](https://github.com/bitflight-devops/github-action-readme-generator/issues/628)) ([a1d3f04](https://github.com/bitflight-devops/github-action-readme-generator/commit/a1d3f04129a91b396741faf8941bcd21bfaffb69))

# [1.11.0](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.10...v1.11.0) (2026-08-08)


### Features

* **ts:** upgrade to TypeScript 7 (Phase 1 of TS7/Vite+ migration) ([#625](https://github.com/bitflight-devops/github-action-readme-generator/issues/625)) ([0755677](https://github.com/bitflight-devops/github-action-readme-generator/commit/0755677b31f501596982701e5690af11b0451dce))

## [1.10.10](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.9...v1.10.10) (2026-08-03)


### Bug Fixes

* move Docker build images to node:24-alpine, sync lockfile engines ([#616](https://github.com/bitflight-devops/github-action-readme-generator/issues/616)) ([d3082db](https://github.com/bitflight-devops/github-action-readme-generator/commit/d3082dbf033a303ce0381299cd956f4307e7476e))

## [1.10.9](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.8...v1.10.9) (2026-07-05)


### Bug Fixes

* migrate biome.json config to schema 2.5.1 ([#592](https://github.com/bitflight-devops/github-action-readme-generator/issues/592)) ([9443437](https://github.com/bitflight-devops/github-action-readme-generator/commit/9443437b5bb54bd74af7a75b396427b6ea2a89fe))

## [1.10.8](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.7...v1.10.8) (2026-06-08)


### Bug Fixes

* **tsconfig:** make TS6 declaration build compatible ([4dc9755](https://github.com/bitflight-devops/github-action-readme-generator/commit/4dc97555fa4f7ac3f12364434a434484d881b195))

## [1.10.7](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.6...v1.10.7) (2026-05-07)


### Bug Fixes

* **deps-dev:** update esbuild-node-externals for esbuild 0.28 ([3546201](https://github.com/bitflight-devops/github-action-readme-generator/commit/3546201f063474015ada6928d267c59b6dfcecbc))

## [1.10.6](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.5...v1.10.6) (2026-04-29)


### Bug Fixes

* bundle prettier into dist by removing it from esbuild external list ([8021b21](https://github.com/bitflight-devops/github-action-readme-generator/commit/8021b21fa0cd853ac36747f1d3de19581d890ccb))
* remove unused stdout variable to fix biome lint error ([576a50c](https://github.com/bitflight-devops/github-action-readme-generator/commit/576a50c2676c50d816c9cc03b449aca24e859c64))

## [1.10.5](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.4...v1.10.5) (2026-04-29)


### Bug Fixes

* correct assignee username capitalization in dependabot.yml ([3724639](https://github.com/bitflight-devops/github-action-readme-generator/commit/37246393442f6372e5ee47baef728ca19a15fb39))

## [1.10.4](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.3...v1.10.4) (2026-04-03)


### Bug Fixes

* resolve vitest version mismatch causing npm ci failures in integration tests ([1ce0b7c](https://github.com/bitflight-devops/github-action-readme-generator/commit/1ce0b7cfc4f444e61d7a0f2310f2da4ccfae13b7))

## [1.10.3](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.2...v1.10.3) (2026-02-13)


### Bug Fixes

* initial plan for @actions/github v9 compatibility ([be413ad](https://github.com/bitflight-devops/github-action-readme-generator/commit/be413ada2b620eb1ef19676ead4d7e54cfe23580))
* update @actions/github imports for v9.0.0 compatibility ([f92e8ed](https://github.com/bitflight-devops/github-action-readme-generator/commit/f92e8edd5a91687651d54bc668c655e51294dba3))

## [1.10.2](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.1...v1.10.2) (2026-02-11)


### Bug Fixes

* initial plan for @actions/github v9 compatibility ([808b3a3](https://github.com/bitflight-devops/github-action-readme-generator/commit/808b3a370ecb1da8a1146384eb7b34630bac7374))
* update @actions/github imports for v9.0.0 compatibility ([1e71bf4](https://github.com/bitflight-devops/github-action-readme-generator/commit/1e71bf4153366109c0962bb44c289542031fe30c))

## [1.10.1](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.10.0...v1.10.1) (2026-02-04)


### Bug Fixes

* restore bold formatting in table first column ([c07a40d](https://github.com/bitflight-devops/github-action-readme-generator/commit/c07a40dd260c98b37df4d5b180c80eac3289e344))

# [1.10.0](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.9.3...v1.10.0) (2026-02-04)


### Features

* add version_source input for flexible version detection ([d8cbcfd](https://github.com/bitflight-devops/github-action-readme-generator/commit/d8cbcfdb5a1e32d25f94f20dd5078195647a0b7e))

## [1.9.3](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.9.2...v1.9.3) (2026-02-04)


### Bug Fixes

* auto-detect owner/repo/version from target repo directory ([c3099a5](https://github.com/bitflight-devops/github-action-readme-generator/commit/c3099a59fb75f14d2444a4978ff31383587cf9bd))
* detect version from target repo releases/tags ([f20021d](https://github.com/bitflight-devops/github-action-readme-generator/commit/f20021dbb67ab40408e70b079958f0083dac2907))
* document project's actual rule enforcement, not Biome defaults ([8006731](https://github.com/bitflight-devops/github-action-readme-generator/commit/800673191577a64eb6ad39b6890910380745864e))
* enable strict Biome linting and fix all violations ([8506785](https://github.com/bitflight-devops/github-action-readme-generator/commit/85067859b45980fe350d2ae0b87e2e01c6e6195f))
* fail integration tests when validation checks fail ([42898b4](https://github.com/bitflight-devops/github-action-readme-generator/commit/42898b42a2720de38948107a89e6753b5b43d694))
* fetch tags when checking out test repositories ([c2c61c7](https://github.com/bitflight-devops/github-action-readme-generator/commit/c2c61c77481f29a3967c8bb892eb76ae563777e5))
* handle .git URLs without suffix in actions/checkout ([e694d09](https://github.com/bitflight-devops/github-action-readme-generator/commit/e694d091439416cb0c535fb38cf25abc096a5be9))
* pass owner/repo to integration tests ([4e4c3fd](https://github.com/bitflight-devops/github-action-readme-generator/commit/4e4c3fdf998dc794ec8f2d67ceb23acb7febbdd5))
* prioritize .git/config from target directory over GITHUB_REPOSITORY ([ac2e10e](https://github.com/bitflight-devops/github-action-readme-generator/commit/ac2e10ef62dff20992d146092cb65d94f6bb1c1a))
* prioritize git tags for version detection (GitHub Actions standard) ([e5c9434](https://github.com/bitflight-devops/github-action-readme-generator/commit/e5c943446c445568a085fa6f673dc4f7c5b61f94))
* replace forEach exception with proper for...of entries() pattern ([6f5873c](https://github.com/bitflight-devops/github-action-readme-generator/commit/6f5873c44d4a345c712d906155d047d414c2325f))
* show full diff in integration test output ([acee396](https://github.com/bitflight-devops/github-action-readme-generator/commit/acee39619dc8f1a208aed80ad2d72320d5d8940a))

## [1.9.2](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.9.1...v1.9.2) (2026-02-01)


### Bug Fixes

* synchronize package.json with package-lock.json for vitest dependencies ([edee36d](https://github.com/bitflight-devops/github-action-readme-generator/commit/edee36d525b509753eff775e4b3f1176ee4600d7))
* update vitest to 4.0.18 to match package-lock.json ([41657b5](https://github.com/bitflight-devops/github-action-readme-generator/commit/41657b5db31979479d2df1c599a885ed7708dbb5))

## [1.9.1](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.9.0...v1.9.1) (2026-01-28)


### Bug Fixes

* disambiguate duplicate TOC anchors and persist empty TOC ([767a192](https://github.com/bitflight-devops/github-action-readme-generator/commit/767a192f871de95f14a66d1e6aa677df8f97334d))

# [1.9.0](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.10...v1.9.0) (2026-01-28)


### Features

* implement table of contents generation for contents section ([3e9a0a4](https://github.com/bitflight-devops/github-action-readme-generator/commit/3e9a0a4e1f1180c94ea0666b12abeb5ed325afdd))

## [1.8.10](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.9...v1.8.10) (2026-01-25)


### Bug Fixes

* **deps:** update github action versions ([#456](https://github.com/bitflight-devops/github-action-readme-generator/issues/456)) ([f6430a7](https://github.com/bitflight-devops/github-action-readme-generator/commit/f6430a7f79b7dbc5af2fe8ea7cf0311300847215))

## [1.8.9](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.8...v1.8.9) (2026-01-18)


### Bug Fixes

* **deps:** update github action versions ([#448](https://github.com/bitflight-devops/github-action-readme-generator/issues/448)) ([4ac9c1b](https://github.com/bitflight-devops/github-action-readme-generator/commit/4ac9c1b4dd530b697c2c7a2e583c28038aa16338))

## [1.8.8](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.7...v1.8.8) (2026-01-11)


### Bug Fixes

* add legacy-peer-deps to .npmrc for CI compatibility ([9ba9b37](https://github.com/bitflight-devops/github-action-readme-generator/commit/9ba9b372a9fad19968a85e57c531efd0dcbe4a11))
* disable n/no-missing-import rule for ESLint compatibility ([0e4141c](https://github.com/bitflight-devops/github-action-readme-generator/commit/0e4141ce1af2aa39ae649d5149fd78372c9c5fa2))
* remove legacy-peer-deps by upgrading and removing unmaintained packages ([3755216](https://github.com/bitflight-devops/github-action-readme-generator/commit/375521699b563c77b003883f2788f16cdf50e0bc))

## [1.8.7](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.6...v1.8.7) (2026-01-08)


### Bug Fixes

* upgrade @typescript-eslint/eslint-plugin to 8.51.0 and remove deprecated rule ([e3034a1](https://github.com/bitflight-devops/github-action-readme-generator/commit/e3034a125beb529b3749f6318232caa007649d73))

## [1.8.6](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.5...v1.8.6) (2026-01-05)


### Bug Fixes

* correct npm ln typo to npm link in setup-node action ([78073c4](https://github.com/bitflight-devops/github-action-readme-generator/commit/78073c48d63ab63402bebdbcf778d4cbe2163e5e))
* revert npm ln to npm link change - ln is a valid alias ([eab4124](https://github.com/bitflight-devops/github-action-readme-generator/commit/eab41249ae6032c7b1c0c19ce66821a4bc250b8a))
* update engines and esbuild-node-externals for Node 25 compatibility ([73968ba](https://github.com/bitflight-devops/github-action-readme-generator/commit/73968bada8e288b987b56771755ec3ef4d597c65))

## [1.8.5](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.4...v1.8.5) (2025-12-07)


### Bug Fixes

* **deps:** update github action versions ([#420](https://github.com/bitflight-devops/github-action-readme-generator/issues/420)) ([f1bdab5](https://github.com/bitflight-devops/github-action-readme-generator/commit/f1bdab5dbb31ec83bd0f2c92e23f8079798e8fab))

## [1.8.4](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.3...v1.8.4) (2025-11-21)


### Bug Fixes

* add 📓 emoji to description and adjust wording to stay under 125 chars ([abd2cad](https://github.com/bitflight-devops/github-action-readme-generator/commit/abd2cadce1dda79f7c480e762bec367e7e3e5b0a))

## [1.8.3](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.2...v1.8.3) (2025-11-21)


### Bug Fixes

* **release:** update package.json ([489cdf9](https://github.com/bitflight-devops/github-action-readme-generator/commit/489cdf9287705c014e3fa04b060e9d235ae60a1c))

## [1.8.2](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.1...v1.8.2) (2025-11-21)


### Bug Fixes

* **ci:** add conventional commits to github actions version updater ([c49de89](https://github.com/bitflight-devops/github-action-readme-generator/commit/c49de89e9ad4027401ffbee34b63c8735c13fa54))

## [1.8.1](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.0...v1.8.1) (2025-11-06)


### Performance Improvements

* externalize prettier to reduce bundle size by 58% ([9d29197](https://github.com/bitflight-devops/github-action-readme-generator/commit/9d29197891d7d913edc69de621d951a81f8f7df5))

# [1.8.0](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.7.2...v1.8.0) (2025-11-05)


### Bug Fixes

* add 'vibes' to contributions for Jamie Nelson ([#414](https://github.com/bitflight-devops/github-action-readme-generator/issues/414)) ([684c155](https://github.com/bitflight-devops/github-action-readme-generator/commit/684c155528588c4aceb754c7c33f68df08c0ef7f))
* add division by zero check and improve diff error handling ([cc937f9](https://github.com/bitflight-devops/github-action-readme-generator/commit/cc937f9f5ebb9b2b23eb8cbd32a747d87ef0efdc))
* add integration test and resolve linting issues ([9e8993a](https://github.com/bitflight-devops/github-action-readme-generator/commit/9e8993a3d50f70a94407f9c39f9f6fefaf89465b)), closes [#335](https://github.com/bitflight-devops/github-action-readme-generator/issues/335) [#335](https://github.com/bitflight-devops/github-action-readme-generator/issues/335)
* apply linting and formatting fixes ([a4392aa](https://github.com/bitflight-devops/github-action-readme-generator/commit/a4392aad13a909b590629b33151a04174f94aae1))
* correct lint:eslint:fix script and apply auto-fixes ([fa7bcee](https://github.com/bitflight-devops/github-action-readme-generator/commit/fa7bceeaaf10d3681aff6708124ebaf529252b7a))
* **defaults:** fix npm release blockage ([34e2f46](https://github.com/bitflight-devops/github-action-readme-generator/commit/34e2f465fb85774bf80e748f68204362298845c0))
* remove match regex from nconf env config to enable INPUT_ var transformation ([b61f097](https://github.com/bitflight-devops/github-action-readme-generator/commit/b61f0970ac26b0040c7d233f455ba044c29433cd))
* update nconf import for CommonJS/ESM compatibility ([#409](https://github.com/bitflight-devops/github-action-readme-generator/issues/409)) ([1878c34](https://github.com/bitflight-devops/github-action-readme-generator/commit/1878c34f20d7e4562964296a5ff56ae75b3ac5ae))
* use Node 24 for semantic-release to satisfy version requirement ([529a2d2](https://github.com/bitflight-devops/github-action-readme-generator/commit/529a2d2dcf3d163606de5660d18b6e3034b42ae5))
* use Node 24 for semantic-release to satisfy version requirement ([5e0acc4](https://github.com/bitflight-devops/github-action-readme-generator/commit/5e0acc4d109f7b85abb309e4a188b6839a7b5df1))
* use sanitized artifact names to avoid special characters ([f64a248](https://github.com/bitflight-devops/github-action-readme-generator/commit/f64a248306a098b253c66319760132eff17ccbfb))


### Features

* add integration test workflow for real-world repositories ([ca961e5](https://github.com/bitflight-devops/github-action-readme-generator/commit/ca961e5a798224a9b4daf3c66bb237ae36a604d3))
* add matrix testing for Node.js 20.x and 24.x versions ([aa4ee85](https://github.com/bitflight-devops/github-action-readme-generator/commit/aa4ee854ee04ac7d69a0d378b92727ee909f47db))
* add Value column to outputs table and pre-commit hook documentation ([81a096d](https://github.com/bitflight-devops/github-action-readme-generator/commit/81a096d7cb62d11e4cc1d9a822ccfe392f060e74))
* enable npm provenance for automated publishing without manual token ([b2484cf](https://github.com/bitflight-devops/github-action-readme-generator/commit/b2484cf22443e8d02ece0073226fffbff43c099e))
* enable npm provenance with OIDC and Node 24 for semantic-release ([#413](https://github.com/bitflight-devops/github-action-readme-generator/issues/413)) ([c526aae](https://github.com/bitflight-devops/github-action-readme-generator/commit/c526aaee08fb507ea6b0dd29c9851b1283c05384))
* **refactor:** JSDocs added, Unit Tests added using ViTest, refactored for maintainability ([#239](https://github.com/bitflight-devops/github-action-readme-generator/issues/239)) ([0451f2c](https://github.com/bitflight-devops/github-action-readme-generator/commit/0451f2c7bbd93cefba4400589ca1d46fde7aa5f4))

# [1.9.0](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.8.0...v1.9.0) (2025-11-05)


### Bug Fixes

* add division by zero check and improve diff error handling ([cc937f9](https://github.com/bitflight-devops/github-action-readme-generator/commit/cc937f9f5ebb9b2b23eb8cbd32a747d87ef0efdc))
* add integration test and resolve linting issues ([9e8993a](https://github.com/bitflight-devops/github-action-readme-generator/commit/9e8993a3d50f70a94407f9c39f9f6fefaf89465b)), closes [#335](https://github.com/bitflight-devops/github-action-readme-generator/issues/335) [#335](https://github.com/bitflight-devops/github-action-readme-generator/issues/335)
* apply linting and formatting fixes ([a4392aa](https://github.com/bitflight-devops/github-action-readme-generator/commit/a4392aad13a909b590629b33151a04174f94aae1))
* correct lint:eslint:fix script and apply auto-fixes ([fa7bcee](https://github.com/bitflight-devops/github-action-readme-generator/commit/fa7bceeaaf10d3681aff6708124ebaf529252b7a))
* remove match regex from nconf env config to enable INPUT_ var transformation ([b61f097](https://github.com/bitflight-devops/github-action-readme-generator/commit/b61f0970ac26b0040c7d233f455ba044c29433cd))
* update nconf import for CommonJS/ESM compatibility ([#409](https://github.com/bitflight-devops/github-action-readme-generator/issues/409)) ([1878c34](https://github.com/bitflight-devops/github-action-readme-generator/commit/1878c34f20d7e4562964296a5ff56ae75b3ac5ae))
* use Node 24 for semantic-release to satisfy version requirement ([529a2d2](https://github.com/bitflight-devops/github-action-readme-generator/commit/529a2d2dcf3d163606de5660d18b6e3034b42ae5))
* use Node 24 for semantic-release to satisfy version requirement ([5e0acc4](https://github.com/bitflight-devops/github-action-readme-generator/commit/5e0acc4d109f7b85abb309e4a188b6839a7b5df1))
* use sanitized artifact names to avoid special characters ([f64a248](https://github.com/bitflight-devops/github-action-readme-generator/commit/f64a248306a098b253c66319760132eff17ccbfb))


### Features

* add integration test workflow for real-world repositories ([ca961e5](https://github.com/bitflight-devops/github-action-readme-generator/commit/ca961e5a798224a9b4daf3c66bb237ae36a604d3))
* add matrix testing for Node.js 20.x and 24.x versions ([aa4ee85](https://github.com/bitflight-devops/github-action-readme-generator/commit/aa4ee854ee04ac7d69a0d378b92727ee909f47db))
* add Value column to outputs table and pre-commit hook documentation ([81a096d](https://github.com/bitflight-devops/github-action-readme-generator/commit/81a096d7cb62d11e4cc1d9a822ccfe392f060e74))
* enable npm provenance for automated publishing without manual token ([b2484cf](https://github.com/bitflight-devops/github-action-readme-generator/commit/b2484cf22443e8d02ece0073226fffbff43c099e))
* enable npm provenance with OIDC and Node 24 for semantic-release ([#413](https://github.com/bitflight-devops/github-action-readme-generator/issues/413)) ([c526aae](https://github.com/bitflight-devops/github-action-readme-generator/commit/c526aaee08fb507ea6b0dd29c9851b1283c05384))

# [1.8.0](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.7.2...v1.8.0) (2023-11-20)


### Bug Fixes

* **defaults:** fix npm release blockage ([34e2f46](https://github.com/bitflight-devops/github-action-readme-generator/commit/34e2f465fb85774bf80e748f68204362298845c0))


### Features

* **refactor:** JSDocs added, Unit Tests added using ViTest, refactored for maintainability ([#239](https://github.com/bitflight-devops/github-action-readme-generator/issues/239)) ([0451f2c](https://github.com/bitflight-devops/github-action-readme-generator/commit/0451f2c7bbd93cefba4400589ca1d46fde7aa5f4))

## [1.7.2](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.7.1...v1.7.2) (2023-10-24)


### Bug Fixes

* **dist:** dist check was failing due to not installing optional dependencies ([347fb89](https://github.com/bitflight-devops/github-action-readme-generator/commit/347fb890c60ab60289f30ab6edd84f038923debd))
* **dist:** dist check was failing due to not installing optional dependencies ([9aa26d9](https://github.com/bitflight-devops/github-action-readme-generator/commit/9aa26d9bde139f2eb626a8901988b96c1117bbff))
* **markdown:** update formatting in tables to use <b> and <code> tags ([e950f20](https://github.com/bitflight-devops/github-action-readme-generator/commit/e950f20770bfd5621084c65e33184687b2b88de4))
* **usage:** usage section was missing descriptions ([8dc2738](https://github.com/bitflight-devops/github-action-readme-generator/commit/8dc273825c7a017ad8ba53d094a119b7f2c4a0c4))
* **usage:** usage section was missing its descriptions ([4d6e063](https://github.com/bitflight-devops/github-action-readme-generator/commit/4d6e06394d39fca2669c8dc5d58bdba3d19c1c34))

## [1.7.1](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.7.0...v1.7.1) (2023-10-24)


### Bug Fixes

* **nconf:** nconf released a fix for dynamic imports ([2e5c3c3](https://github.com/bitflight-devops/github-action-readme-generator/commit/2e5c3c3e4ed53905c8da13f0511c673b1ef83815))

# [1.7.0](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.6.0...v1.7.0) (2023-10-22)


### Bug Fixes

* **readme:** newlines missing around content sections in readme ([0ca9980](https://github.com/bitflight-devops/github-action-readme-generator/commit/0ca99809b643d5e82958dda81c6db5d7bdb1c423))


### Features

* **branding:** icons now correctly centered on circle ([2c26d93](https://github.com/bitflight-devops/github-action-readme-generator/commit/2c26d93f8452d77bf8516260f6fcfd45196e9590))
* **branding:** new segment for readme generates action.yml branding svg ([07c3bbe](https://github.com/bitflight-devops/github-action-readme-generator/commit/07c3bbecc903787613d3ffcae016673785b1016d))
* **engines:** update node engines to be >= 18, from 14 ([35b5d08](https://github.com/bitflight-devops/github-action-readme-generator/commit/35b5d089a2cb83cdf6bfe88a2bc45cf6aba90a12))
* improve devx ([9f34cf8](https://github.com/bitflight-devops/github-action-readme-generator/commit/9f34cf8926303b84d2040ddb072ebe6bb6f9820d))

# [1.6.0](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.5.1...v1.6.0) (2023-10-16)


### Bug Fixes

* **test:** inputs test was failing due to node20 bundling error ([7b5cac4](https://github.com/bitflight-devops/github-action-readme-generator/commit/7b5cac4d69c8fad291e374b3140a230dcf8ba358))


### Features

* **refactor:** make the readme sections update in memory before writing it out once ([a4468c1](https://github.com/bitflight-devops/github-action-readme-generator/commit/a4468c1bc0bf7c744402a4904baa87f2eec9f36e))

## [1.5.1](https://github.com/bitflight-devops/github-action-readme-generator/compare/v1.5.0...v1.5.1) (2023-10-14)


### Bug Fixes

* only replace grave accents when vertical pipe ([e69fb0d](https://github.com/bitflight-devops/github-action-readme-generator/commit/e69fb0d2f3ccb197367f59c75ba87dd571cc2227))
* **release:** update the release workflows ([4f5b377](https://github.com/bitflight-devops/github-action-readme-generator/commit/4f5b377941793318606657fa6d9f1e56d91bb41c))
