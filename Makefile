.PHONY: help

MAKEFLAGS += --silent
.DEFAULT_GOAL := help

help: ## Show help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m\033[0m\n"} /^[$$()% a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

setup: ## Setup development environment
	docker build -t github-action-readme-generator:latest .
	npm install

lint: ## Run linter
	$(call docker-run,npm run prelint $(filter-out $@,$(MAKECMDGOALS)))
	$(call docker-run,npm run lint $(filter-out $@,$(MAKECMDGOALS)))
	$(call docker-run,npm run lint:markdown $(filter-out $@,$(MAKECMDGOALS)))

lint-fix: ## Fix lint errors
	$(call docker-run,npm run format $(filter-out $@,$(MAKECMDGOALS)))
	$(call docker-run,npm run lint:fix $(filter-out $@,$(MAKECMDGOALS)))
	$(call docker-run,npm run lint:markdown:fix $(filter-out $@,$(MAKECMDGOALS)))

test: ## Run tests
	$(call docker-run,npm run test $(filter-out $@,$(MAKECMDGOALS)))

npm: ## Exec npm in application container
	$(call docker-run,npm $(filter-out $@,$(MAKECMDGOALS)))

#############################
# Argument fix workaround
#############################
%:
	@:

define docker-run
	docker run --rm -it -v $(PWD):/app -w /app github-action-readme-generator:latest $(1)
endef
