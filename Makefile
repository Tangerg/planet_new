# Go entrypoints for the backend + the Wails main package.
#
# The package set is listed EXPLICITLY rather than via `./...`: Go's `...` glob
# does not skip `node_modules`, and `frontend/node_modules/flatted/golang` ships
# a stray Go package that would otherwise be swept into `go test ./...` /
# `go vet ./...`. Scoping to our own packages keeps the backend checks honest.
GO_PKGS := . ./backend/...

.PHONY: test vet check

# Run the backend test suite (SQLite catalog, scanner, media server, domain, app).
test:
	go test $(GO_PKGS)

# Static analysis over the same scope.
vet:
	go vet $(GO_PKGS)

# The backend gate: vet + tests.
check: vet test
