# detect what shell is used
ifeq ($(findstring cmd.exe,$(SHELL)),cmd.exe)
DEVNUL := NUL
WHICH := where
else
DEVNUL := /dev/null
WHICH := which
endif

PATH_TO_FILE=.env
ifneq ("$(wildcard $(PATH_TO_FILE))","")
    LOAD_ENV = --env-file .env
else
    LOAD_ENV =
endif


.PHONY: help

MAKEFLAGS += --silent
.DEFAULT_GOAL := help

EXECUTABLES = docker corepack pnpm npm node
# detect platform independently if $exec is installed
K := $(foreach exec,$(EXECUTABLES),\
        $(if $(shell ${WHICH} $(exec) 2>${DEVNUL}),some string,$(error "No $(exec) in PATH. Please install it")))

help: ## Show help message
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m\033[0m\n"} /^[$$()% a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

setup: ## Setup development environment
	docker build -t github-action-readme-generator:latest .
	corepack enable
	pnpm install

lint: ## Run linter
	$(call docker-run,pnpm run prelint $(filter-out $@,$(MAKECMDGOALS)))
	$(call docker-run,pnpm run lint $(filter-out $@,$(MAKECMDGOALS)))
	$(call docker-run,pnpm run lint:markdown $(filter-out $@,$(MAKECMDGOALS)))

lint-fix: ## Fix lint errors
	$(call docker-run,pnpm run format $(filter-out $@,$(MAKECMDGOALS)))
	$(call docker-run,pnpm run lint:fix $(filter-out $@,$(MAKECMDGOALS)))
	$(call docker-run,pnpm run lint:markdown:fix $(filter-out $@,$(MAKECMDGOALS)))

test: ## Run tests
	$(call docker-run,pnpm run test $(filter-out $@,$(MAKECMDGOALS)))

pnpm: ## Exec pnpm in application container
	$(call docker-run,pnpm $(filter-out $@,$(MAKECMDGOALS)))

npm: pnpm # npm is an alias for pnpm

#############################
# Argument fix workaround
#############################
%:
	@:


define docker-run
	docker run --rm -it $(LOAD_ENV) -v "$(PWD):/app" -w /app "github-action-readme-generator:latest" $(1)
endef
