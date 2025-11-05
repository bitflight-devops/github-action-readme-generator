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
