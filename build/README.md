# Build Directory

Everything Wails v3 needs to turn the Go binary into a platform application lives here. Unlike v2, the
build is not driven by an opaque CLI: each platform has its own `Taskfile.yml`, and `wails3 build` /
`wails3 package` simply dispatch to it (see the root `Taskfile.yml`). Read and edit those tasks directly.

## Layout

- `config.yml` — the single source of application metadata (name, identifier, version, copyright) plus the
  `wails3 dev` file-watch configuration. **Edit this, not the generated files below.**
- `appicon.png` — the master icon. `wails3 task common:generate:icons` derives `darwin/icons.icns` and
  `windows/icon.ico` from it.
- `Taskfile.yml` — shared tasks: frontend install/build, binding generation, icon generation.
- `darwin/`, `windows/`, `linux/` — per-platform build/package tasks and their assets.
- `docker/Dockerfile.cross` — the cross-compilation image used when building for a platform from another
  host (`wails3 task setup:docker` builds it).

Build output goes to `bin/` in the repository root (gitignored), not `build/bin` as in v2.

## Regenerating assets

`wails3 task common:update:build-assets` re-renders the templated assets (plists, `info.json`, the desktop
entry, the NSIS/MSIX manifests) from `config.yml`. It overwrites hand edits, so keep customisation in
`config.yml` where possible.

Both macOS plists carry `NSAppTransportSecurity → NSAllowsLocalNetworking`. That exception is what lets the
WKWebView reach the on-device library's loopback media server (`http://127.0.0.1:<port>`); do not remove it.

Mobile (iOS/Android) and server/Docker deployment targets ship with the Wails template but are out of scope
for this project, so their assets and task includes are not checked in.
