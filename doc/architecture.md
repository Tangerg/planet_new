# Planet 架构总览

Planet 是一个 Wails 桌面音乐播放器。Go 端主要提供桌面壳、窗口配置和 Wails bridge；业务逻辑、播放编排、数据源接入和界面状态主要在前端完成。例外是**本地音乐库**：文件夹扫描、SQLite 元数据、音频流服务在 Go 侧（`backend/` 包，与 `frontend/` 对称），经 Wails 桥接暴露给前端的 `LocalMusic` provider。根目录只保留 `main.go`（入口 + `backend.New()` 组装）。

本文描述当前代码结构。更细的工作约定见 `frontend/CLAUDE.md`。

---

## 1. 项目定位

- 桌面壳：Wails v2 + Go，入口 `main.go`（根目录唯一 `.go`），后端在 `backend/`（组合根 `backend.App` + 音乐库适配器）。
- 前端：React 19 + TypeScript + Vite + Tailwind v4。
- 数据：所有外部音乐数据经 `MusicProvider` 端口进入，具体实现位于 `frontend/src/providers`。
- 播放：浏览器侧 `<audio>` + Web Audio 能力，由 `core` 插件封装。
- UI：`frontend/src/ui` 是播放器界面和单页导航状态机，不直接依赖具体 provider。

```
┌─────────────────────────────────────────────────────────────┐
│                      Wails desktop shell                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ React UI                                               │  │
│  │ Shell · Screens · Components · Hooks · Zustand stores  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Application facade                                     │  │
│  │ Engine · PlaybackService · MediaService · AuthService  │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Planet kernel                                          │  │
│  │ PluginContext · CapabilityRegistry · EventEmitter      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Plugins + providers                                    │  │
│  │ Playback · Queue · Progress · Volume · Lyrics · NCM    │  │
│  │ QQMusic · Spotify · Local                              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

`Local` reaches down into the Go `backend` package (below) over the Wails bridge;
the others are network API adapters.

---

## 2. 顶层目录

```
planet_new/
├─ main.go                       Wails entry (root's only .go; assembles via backend.New)
├─ backend/                      Go desktop-shell side, clean-architecture layers:
│    domain/                       framework-free entities, value objects, ports
│    application/                  use-case service (orchestration, FolderPicker port)
│    sqlite/ scan/ media/          port implementations (repo, scanner, loopback server)
│    app.go / library.go / dto.go  composition root + Wails-bound adapter + wire DTOs
├─ build/                        Wails packaging assets (incl. darwin ATS plist)
├─ doc/                          Project docs
├─ go.mod / wails.json           Go and Wails config
└─ frontend/
   ├─ package.json               Frontend scripts and dependencies
   ├─ vite.config.ts             Vite, Tailwind, aliases, test config
   ├─ src/
   │  ├─ shared/                 Pure framework-free utilities
   │  ├─ domain/                 Models and ports
   │  ├─ core/                   Kernel, events, plugins, application services
   │  ├─ providers/              Infrastructure adapters for music sources
   │  ├─ ui/                     React interface
   │  ├─ app/                    Composition root
   │  └─ main.tsx                React entry
   └─ wailsjs/                   Wails generated JS bridge
```

---

## 3. Frontend Layers

The dependency rule is one-way:

```
shared <- domain <- core <- providers <- ui <- app
```

| Layer | Path | Role |
|---|---|---|
| Shared | `src/shared` | Small pure utilities with no framework dependency. |
| Domain | `src/domain` | Music entities, value objects, provider/auth/library ports. |
| Core | `src/core` | Planet kernel, typed event bus, plugin system, playback/application services. |
| Providers | `src/providers` | Concrete data-source adapters and mappers for NCM, QQMusic, Spotify. |
| UI | `src/ui` | React screens, components, hooks, i18n, shell navigation, Zustand bridges. |
| App | `src/app` | Runtime composition: create providers, plugins, kernel, and `Engine`. |

The rule is enforced by `frontend/scripts/check-layers.mjs`. New code should move dependencies inward through ports, services, events, or capabilities instead of importing outward.

---

## 4. Domain And Providers

`domain/ports/provider.ts` defines `MusicProvider`, the only surface the application layer uses for catalog data:

- playlist / album / artist detail
- lyrics
- playable URLs
- personalized home data
- search
- toplists
- comments

Providers declare capabilities with `ProviderCapability`, so UI and services can gracefully handle missing features. Unsupported optional methods return empty values from the base provider instead of forcing scattered `try/catch` or UI-side mocking.

Concrete providers:

| Provider | Notes |
|---|---|
| `NeteaseCloudMusic` | Local NCM API service, supports richer real catalog/playback flows; the default/fallback provider. |
| `QQMusic` | Local QQ Music API service. |
| `Spotify` | Spotify Web API; playback is preview-limited where available. |
| `LocalMusic` | On-device library via the Go `backend` package over the Wails bridge; full playback of local files. |

Provider selection starts in `frontend/src/app/planet.ts`: all constructible providers are mounted, and `ProviderRegistry` chooses the active one by name. Runtime switching goes through the registry, not through UI imports of concrete adapters — the Settings screen's source switch reads provider names off the runtime registry (`engine.providers`) rather than importing the adapters.

**On-device library (Go `backend` package).** The Go side mirrors the frontend's clean-architecture layering, one package per layer with the dependency rule pointing inward: `domain` (framework-free entities, value objects `TrackID`/`Duration`/`Cover`, the tag-normalization rules on `TrackMetadata`, and the `Catalog`/`Scanner` ports) ← `application` (the framework-free use-case `Service`: scan orchestration + reads, depending only on ports incl. a `FolderPicker`) ← `sqlite` (repository), `scan` (filesystem + tag reader), `media` (loopback server) as port implementations ← the `backend` package itself (composition root `App` + the Wails-bound `Library` adapter: string-id boundary, delegates to the service, projects DTOs + loopback URLs). Only the `Library` adapter is bound; the `application`/`domain` layers never import SQL, the filesystem, or Wails (the native dialog is behind the `FolderPicker` port, implemented by a Wails adapter and injected at the composition root). `ScanFolder` walks a directory, reads tags via `dhowden/tag`, probes duration (MP3/FLAC/WAV), and upserts into an embedded SQLite catalog (`modernc.org/sqlite`, pure-Go / `CGO_ENABLED=0`). Audio + cover art are streamed to the webview by a **loopback HTTP server** (`http.ServeContent`, so Range/seek work); each track's `playUrl` is an absolute `http://127.0.0.1:<port>/media/<id>` URL that works identically in `wails dev` and a production build. A standalone server is used rather than the Wails asset handler because the asset handler diverges on media/range requests between dev and platforms. macOS needs an ATS exception for `127.0.0.1` (`build/darwin/Info*.plist`). The `LocalMusic` provider reaches the Go service through the generated `@wailsjs` bridge and maps its neutral DTOs into domain entities; because tracks arrive with `playUrl` already resolved, playback needs no `playUrls()` round-trip. The Settings screen triggers scans via a native folder dialog (`ui/infra/localLibrary.ts`, a desktop-shell shim alongside `ui/infra/wails.ts`).

---

## 5. Core Kernel

The kernel is centered on three pieces:

| Piece | Path | Purpose |
|---|---|---|
| Event bus | `core/event` | Strongly typed publish/subscribe for state facts and internal choreography. |
| Capability registry | `core/kernel/capability.ts` | Plugins publish typed capabilities; services resolve them by capability key. |
| Plugin lifecycle | `core/kernel/plugin.ts` | `init` / `dispose` with shared `PluginContext`. |

`Planet` installs plugins in dependency order, rolls back on init failure, and disposes in reverse order. Plugins communicate by:

- Direct capability calls for commands with a single receiver.
- Events for state changes and cross-plugin facts.

This split is deliberate: commands like `playback.play()` return through services/capabilities; facts like `queue:current-changed` or `volume:changed` are broadcast.

---

## 6. Application Facade

`Engine` is the UI's single handle to the runtime:

- `engine.playback` wraps queue, transport, seek, volume, shuffle, repeat.
- `engine.media` reads catalog/search/detail/comment data through the active provider.
- `engine.auth` coordinates provider auth with the credential store.
- `engine.library` reads logged-in user library features when supported.
- `engine.events` exposes kernel state events for store bridges and UI hooks.
- `engine.providers` exposes provider listing and active-provider switching.

This keeps React from resolving plugins directly or importing concrete providers.

---

## 7. UI Layer

The UI is a resident single-page shell:

- `ui/Shell.tsx` composes playback, catalog, auth, navigation, context menu, shortcuts, and screens.
- Per-concern data hooks under `ui/hooks/` (catalog, library, music-video, track content, …) read through the application services with React Query for caching; `ui/model/adapters/` maps domain models into the UI display shapes (`VibeTrack` etc.).
- `ui/store/bridge.ts` mirrors kernel events into Zustand stores.
- `ui/infra/morph` and navigation hooks manage shared-element transitions between screens.

The project intentionally does not use a route-per-screen model. Navigation is a state machine inside the shell so screens can participate in the same morph/measurement context.

---

## 8. Projection And Failure Boundaries

Three conventions at the UI ↔ domain / provider seams. Documented so they read as deliberate, not as leftover shims.

**`VibeTrack.source` — the play handoff carry (not a DTO backflow).**
Screens are pure presentation and receive `VibeTrack` view models. Playing one hands the kernel a domain `Track`; rather than re-fetch or reconstruct it, each `VibeTrack` carries the `Track` it was projected from as `source`. This is load-bearing: the play queue stores domain tracks and Now Playing re-projects them **client-side**, so a lightweight id-only ref would force a re-fetch or a parallel id→Track cache — which is exactly what `source` already is. Boundary rule: only the track adapter writes `source` (it is `readonly`), and only `toTrack()` reads it back (with a minimal-synthesis fallback for hand-built view tracks such as the placeholder). Do not "remove the domain back-reference" — keep it, named honestly.

**Collection detail hint — `fetchDetail`.**
`VibeCollection.fetchDetail` answers "should opening this collection fetch full detail from the provider?" Default (undefined) = fetch; explicit `false` = tracks are already loaded (synthetic collections like Daily Mix / Liked Songs; a chart sets it `true`). It is the only meaning of that flag — the earlier dual-purpose `_real` name (a domain carrier on tracks vs. a boolean hint on collections) was split into `source` and `fetchDetail`.

**Provider read failure — one shape, no `Result` wrapper.**
`MediaService` never lets one bad read blank the app: an unsupported capability returns its fallback silently, while a *supported* read that faults returns the same fallback but reports it through `@shared/debug.warnReadFailure` — so "endpoint down" is distinguishable from "no data" in the console. Empty-but-successful is a valid result, not a fault. The UI already has the three signals separately — `media.supports(cap)` (unsupported), React Query `isError` (failed), `data.length` (empty) — so no `Result` type is threaded through every caller.

**Track identity vs playback key.**
`Track.id` is the domain identity used for selection, queue matching, and navigation. Stream URL resolution uses `Track.playbackId` instead. They are often the same (NCM / Spotify), but not guaranteed: QQ chart rows may expose a numeric `songId` while playback resolution needs `songmid`. A track without `playbackId` is not provider-resolvable even if it has an `id`; this keeps list UI from promising playback that the provider cannot actually start.

**Audible playback vs analysis source.**
The playback plugin always loads `Track.playUrl` directly into the audible `<audio>` element. Web Audio visualization is a separate analysis-only path: `AudioEngine` owns a hidden probe element, and only that probe may use a `MediaAnalysisSourceResolver` to resolve a CORS-clean loopback/proxy URL. Do not route the audible player through the analysis resolver — provider playback compatibility is more important than sampling convenience, and the probe can fail back to idle motion without muting the real player.

**MV availability is separate from track playback availability.**
`MusicVideo.playbackAvailability(video, policy)` owns MV-specific rules (missing MV id, provider unsupported, URL not yet resolved, resolved-but-missing URL, provider licence unavailable). Do not fold MV state into `Track.isUnavailable()`; songs and official music videos are related media, but their playback resolution paths and failure reasons differ.

Provider mappers share one field-normalization standard (`providers/mapping.ts`): `toIdString` (ids → string), `singleImage` (one URL → the `Image[]` contract), `secondsToMs` (seconds → the domain's `durationMs`). Image URL-scheme building and artist-credit shaping stay provider-specific / domain-owned respectively.

---

## 9. Quality Gates

Frontend quality checks live in `frontend/package.json`:

```bash
yarn typecheck
yarn lint
yarn format:check
yarn test
yarn knip
yarn check:circular
yarn check:layers
```

`yarn check` runs the aggregate gate. The current tests focus on pure domain/shared/core utilities; UI and provider behavior need broader test coverage as the product stabilizes.
