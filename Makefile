# Go entrypoints for the backend + the Wails main package.
#
# The package set is listed EXPLICITLY rather than via `./...`: Go's `...` glob
# does not skip `node_modules`, and `frontend/node_modules/flatted/golang` ships
# a stray Go package that would otherwise be swept into `go test ./...` /
# `go vet ./...`. Scoping to our own packages keeps the backend checks honest.
GO_PKGS := . ./backend/...
GO_VERSION := $(shell awk '/^go / { print $$2; exit }' go.mod)
GO := GOTOOLCHAIN=go$(GO_VERSION) go

.PHONY: test test-race vet vuln frontend-check frontend-build check

# Run the backend test suite (SQLite catalog, scanner, media server, domain, app).
test: frontend-build
	$(GO) test $(GO_PKGS)

# Race detector protects the scanner/server lifecycle and other concurrent paths.
test-race: frontend-build
	$(GO) test -race $(GO_PKGS)

# Static analysis over the same scope.
vet: frontend-build
	$(GO) vet $(GO_PKGS)

# Scan the application packages with the version-pinned Go vulnerability tool.
vuln: frontend-build
	$(GO) tool govulncheck $(GO_PKGS)

# Frontend gate: types, lint, formatting, tests, dead-code/cycle/layer guards.
frontend-check:
	yarn --cwd frontend run check

# Production bundling is separate from typecheck and catches Vite/Rollup issues.
frontend-build:
	yarn --cwd frontend build

# Root Go packages embed frontend/dist, so every compile-oriented Go target has
# an explicit frontend-build prerequisite. This keeps clean checkouts honest and
# lets Make deduplicate the build even when several checks depend on it.
check: vet test-race vuln frontend-check
