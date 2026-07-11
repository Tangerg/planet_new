# Go entrypoints for the backend + the Wails main package.
#
# The package set is listed EXPLICITLY rather than via `./...`: Go's `...` glob
# does not skip `node_modules`, and `frontend/node_modules/flatted/golang` ships
# a stray Go package that would otherwise be swept into `go test ./...` /
# `go vet ./...`. Scoping to our own packages keeps the backend checks honest.
GO_PKGS := . ./backend/...

.PHONY: test test-race vet frontend-check frontend-build check

# Run the backend test suite (SQLite catalog, scanner, media server, domain, app).
test:
	go test $(GO_PKGS)

# Race detector protects the scanner/server lifecycle and other concurrent paths.
test-race:
	go test -race $(GO_PKGS)

# Static analysis over the same scope.
vet:
	go vet $(GO_PKGS)

# Frontend gate: types, lint, formatting, tests, dead-code/cycle/layer guards.
frontend-check:
	yarn --cwd frontend run check

# Production bundling is separate from typecheck and catches Vite/Rollup issues.
frontend-build:
	yarn --cwd frontend build

# One repository-wide verification command, used identically by CI and locally.
check: vet test-race frontend-check frontend-build
