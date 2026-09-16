# Repository instructions

Engineering conventions that apply to every change live in [`AGENTS.md`](AGENTS.md). The rules below hold only
for this repository, and each one resolves a question `AGENTS.md` deliberately leaves open.

- **Backward compatibility is not a goal during development.** Remove obsolete paths instead of adding
  compatibility layers, fallbacks, or migrations. Make architectural decisions for the long term while
  breaking changes are still inexpensive, and do not accept a stopgap that is meant to be replaced later.
- **Grow the system in layers.** Start from the smallest version that works end to end, and add each new
  capability on top of a product that already works. Never trade a working product for unfinished complexity.
- **Repository-local usage is no evidence for or against a public API.** Retain or remove exported operations
  and extension points by responsibility, abstraction quality, and downstream utility, never merely because
  code in this repository does or does not call them.
- **Use explicit `Config` structs** for related construction settings, and give optional fields useful zero
  meanings. Do not introduce functional-options APIs.
- **Provider ports own data access.** The application never reaches a music service directly; it calls a
  provider, which resolves to a locally running API service. A page that fetches on its own is a second data
  owner, and an unavailable backend must render an honest empty state rather than fail.
- **The UI layer carries no comments.** `frontend/src/ui/**` reads from its naming, types and structure
  alone; the only exceptions are tool directives such as `oxlint-disable-*`. Elsewhere the comment rules in
  `AGENTS.md` apply unchanged — if a UI decision needs an explanation, it belongs in that layer's README or
  in the commit that made it.
